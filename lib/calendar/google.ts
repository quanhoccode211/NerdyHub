import 'server-only'
import { prisma } from '@/lib/db'
import { decrypt, encrypt } from '@/lib/crypto'

/**
 * Kết nối Google Calendar — CHỈ ĐỌC.
 *
 * Mục đích duy nhất: đọc các khoảng ĐÃ BẬN trong lịch của người dùng để gợi ý
 * giờ trống mà ôn bài. Không tạo, không sửa, không xoá sự kiện nào.
 *
 * Scope là `calendar.readonly`, và ta chỉ gọi endpoint `freeBusy` — endpoint này
 * trả về đúng các mốc bận/rảnh, KHÔNG trả tiêu đề, mô tả hay khách mời. Nghĩa là
 * kể cả khi token bị lộ qua chính đường này, nội dung lịch vẫn không đi ra ngoài.
 * Đây là chủ ý thiết kế, đừng đổi sang `events.list` cho tiện.
 *
 * Luồng OAuth ở đây TÁCH KHỎI Auth.js: đăng nhập bằng Google (F6) và cấp quyền
 * đọc lịch (F5) là hai sự đồng ý khác nhau, ở hai thời điểm khác nhau. Gộp vào
 * một lần xin quyền thì người chỉ muốn đăng nhập bị đòi luôn quyền đọc lịch.
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy'
const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList'

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

/** Đổi token sớm hơn hạn 2 phút — tránh đua với độ trễ mạng. */
const REFRESH_SKEW_MS = 2 * 60 * 1000

export function isCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}/api/calendar/callback`
}

/**
 * URL màn hình xin quyền của Google.
 *
 * `access_type=offline` + `prompt=consent` là BẮT BUỘC: thiếu chúng Google chỉ
 * trả access token sống 1 giờ và KHÔNG trả refresh token, nên kết nối chết sau
 * đúng một giờ. `prompt=consent` phải giữ kể cả khi người dùng đã từng đồng ý —
 * Google chỉ phát lại refresh token khi màn hình đồng ý hiện ra thật.
 */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTH_URL}?${params}`
}

type TokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}

async function postForm(url: string, body: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    cache: 'no-store',
  })
}

/** Đổi `code` ở callback lấy cặp token. Ném lỗi nếu Google từ chối. */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await postForm(TOKEN_URL, {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirect_uri: redirectUri(),
    grant_type: 'authorization_code',
  })
  if (!res.ok) throw new Error(`Đổi code thất bại: ${res.status}`)
  return (await res.json()) as TokenResponse
}

/** Lưu kết nối. Token được MÃ HOÁ trước khi chạm tới database. */
export async function saveConnection(userId: string, tokens: TokenResponse, refreshToken: string) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
  const data = {
    provider: 'google',
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(refreshToken),
    expiresAt,
    syncEnabled: true,
  }
  await prisma.calendarConnection.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data, lastSyncAt: null },
  })
}

export type ConnectionState =
  | { status: 'none' }
  | { status: 'broken'; reason: string }
  | { status: 'ok'; accessToken: string; connectedAt: Date; lastSyncAt: Date | null }

/**
 * Lấy access token còn hạn, tự làm mới khi cần.
 *
 * Khi làm mới THẤT BẠI (người dùng thu hồi quyền ở tài khoản Google, hoặc app
 * còn ở chế độ Testing nên refresh token hết hạn sau 7 ngày — xem
 * docs/google-oauth-setup.md), ta TẮT `syncEnabled` và trả về 'broken'. Cố thử
 * lại vô hạn chỉ tạo ra một vòng lặp gọi Google mỗi lần mở trang.
 */
export async function getConnection(userId: string): Promise<ConnectionState> {
  const conn = await prisma.calendarConnection.findUnique({ where: { userId } })
  if (!conn) return { status: 'none' }
  if (!conn.syncEnabled) {
    return { status: 'broken', reason: 'Kết nối đã dừng, cần cấp quyền lại.' }
  }

  const ok = (accessToken: string) => ({
    status: 'ok' as const,
    accessToken,
    connectedAt: conn.createdAt,
    lastSyncAt: conn.lastSyncAt,
  })

  // Token giải mã không được thì coi như hỏng — hay gặp nhất là ENCRYPTION_KEY đã đổi
  let accessToken: string
  let refreshToken: string
  try {
    accessToken = decrypt(conn.accessToken)
    refreshToken = decrypt(conn.refreshToken)
  } catch {
    await disableConnection(userId)
    return { status: 'broken', reason: 'Không đọc được token đã lưu, cần kết nối lại.' }
  }

  if (conn.expiresAt.getTime() - REFRESH_SKEW_MS > Date.now()) return ok(accessToken)

  const res = await postForm(TOKEN_URL, {
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  if (!res.ok) {
    await disableConnection(userId)
    return { status: 'broken', reason: 'Google đã thu hồi quyền, cần kết nối lại.' }
  }

  const fresh = (await res.json()) as TokenResponse
  await prisma.calendarConnection.update({
    where: { userId },
    data: {
      accessToken: encrypt(fresh.access_token),
      // Google thường KHÔNG trả refresh token mới ở nhánh này — giữ cái cũ
      ...(fresh.refresh_token ? { refreshToken: encrypt(fresh.refresh_token) } : {}),
      expiresAt: new Date(Date.now() + fresh.expires_in * 1000),
    },
  })
  return ok(fresh.access_token)
}

async function disableConnection(userId: string) {
  await prisma.calendarConnection.update({
    where: { userId },
    data: { syncEnabled: false },
  })
}

/** Ngắt kết nối: thu hồi quyền ở phía Google RỒI mới xoá bản ghi. */
export async function disconnect(userId: string) {
  const conn = await prisma.calendarConnection.findUnique({ where: { userId } })
  if (!conn) return

  try {
    // Thu hồi refresh token là thu hồi cả cây access token sinh ra từ nó
    await postForm(REVOKE_URL, { token: decrypt(conn.refreshToken) })
  } catch {
    // Google từ chối hoặc token đã hỏng — vẫn phải xoá bản ghi phía mình,
    // nếu không người dùng bấm "ngắt kết nối" mà dữ liệu vẫn nằm lại.
  }

  await prisma.calendarConnection.delete({ where: { userId } })
}

export type BusySlot = { start: Date; end: Date }

/**
 * Danh sách lịch mà người dùng đang BẬT hiển thị.
 *
 * Bắt buộc phải có bước này. Rất nhiều người để lịch học, lịch thi, lịch câu lạc bộ
 * ở các lịch RIÊNG (hoặc lịch được chia sẻ / đăng ký), còn `primary` thì gần như
 * trống. Hỏi mỗi `primary` là thấy cả tuần rảnh trong khi thực tế kín lịch — sai
 * theo hướng nguy hiểm nhất, vì nó tự tin gợi ý đúng vào giờ người ta đang học.
 *
 * `selected: false` là lịch người dùng đã tắt hiển thị trong Google Calendar —
 * tôn trọng lựa chọn đó, họ không coi nó là lịch của mình. `freeBusy` nhận tối đa
 * 50 mục một lần.
 */
async function listCalendarIds(accessToken: string): Promise<string[]> {
  const res = await fetch(`${CALENDAR_LIST_URL}?minAccessRole=freeBusyReader&maxResults=250`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  // Không đọc được danh sách thì vẫn còn lịch chính để dùng, đừng làm hỏng cả trang
  if (!res.ok) return ['primary']

  const json = (await res.json()) as {
    items?: { id?: string; selected?: boolean; deleted?: boolean }[]
  }
  const ids = (json.items ?? [])
    .filter((c) => c.id && !c.deleted && c.selected !== false)
    .map((c) => c.id as string)

  return ids.length > 0 ? ids.slice(0, 50) : ['primary']
}

/**
 * Các khoảng ĐÃ BẬN trong quãng thời gian cho trước, gộp từ MỌI lịch đang bật.
 * Chỉ trả về mốc thời gian — endpoint freeBusy không hề trả nội dung sự kiện.
 */
export async function getBusySlots(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<BusySlot[]> {
  const calendarIds = await listCalendarIds(accessToken)

  const res = await fetch(FREEBUSY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: calendarIds.map((id) => ({ id })),
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`freeBusy thất bại: ${res.status}`)

  const json = (await res.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>
  }

  // Gộp busy của TẤT CẢ lịch lại thành một dòng thời gian duy nhất.
  // Lịch nào lỗi (bị thu hồi quyền chẳng hạn) thì Google trả `errors` và không có
  // `busy` — bỏ qua lịch đó, đừng để nó kéo sập phần còn lại.
  return Object.values(json.calendars ?? {})
    .flatMap((c) => c.busy ?? [])
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

export type FreeSlot = { start: Date; end: Date; minutes: number }

/**
 * Đảo các khoảng bận thành khoảng trống, trong khung giờ học mỗi ngày.
 *
 * Chỉ giữ khoảng đủ dài để làm được việc gì đó (`minMinutes`) — gợi ý một khe 10
 * phút giữa hai cuộc họp thì vô dụng. Các khoảng bận CHỒNG LẤN nhau phải được
 * gộp trước, nếu không một cuộc họp nằm lọt trong cuộc họp khác sẽ cắt nhầm và
 * sinh ra khoảng trống âm.
 */
export type WindowOpts = {
  days: number
  dayStartHour: number
  dayEndHour: number
  minMinutes: number
  /** Đệm trước và sau mỗi khoảng bận, tính bằng phút */
  bufferMinutes: number
}

/** Gộp các khoảng bận chồng lấn thành một dòng thời gian không giao nhau. */
function mergeBusy(busy: BusySlot[]): BusySlot[] {
  const merged: BusySlot[] = []
  for (const b of [...busy].sort((x, y) => x.start.getTime() - y.start.getTime())) {
    const last = merged[merged.length - 1]
    if (last && b.start.getTime() <= last.end.getTime()) {
      if (b.end.getTime() > last.end.getTime()) last.end = new Date(b.end)
    } else {
      merged.push({ start: new Date(b.start), end: new Date(b.end) })
    }
  }
  return merged
}

export function findFreeSlots(busy: BusySlot[], opts: WindowOpts): FreeSlot[] {
  const merged = mergeBusy(busy)

  const out: FreeSlot[] = []
  const now = Date.now()
  const buffer = opts.bufferMinutes * 60_000

  for (let d = 0; d < opts.days; d++) {
    const day = new Date()
    day.setDate(day.getDate() + d)

    const from = new Date(day)
    from.setHours(opts.dayStartHour, 0, 0, 0)
    const to = new Date(day)
    to.setHours(opts.dayEndHour, 0, 0, 0)

    // Hôm nay thì bắt đầu từ BÂY GIỜ, đừng gợi ý một khung giờ đã trôi qua
    let cursor = Math.max(from.getTime(), now)

    for (const b of merged) {
      if (b.end.getTime() <= cursor) continue
      if (b.start.getTime() >= to.getTime()) break

      /*
        ĐỆM hai đầu: khe ôn bài kết thúc sớm hơn giờ bận `bufferMinutes` phút, và
        bắt đầu muộn hơn giờ tan `bufferMinutes` phút. Không ai đứng dậy khỏi bàn
        học đúng giây bắt đầu tiết kế tiếp — một khe dán sát vào lịch bận là khe
        trên giấy, không phải khe dùng được.
      */
      const slotStart = cursor
      const slotEnd = b.start.getTime() - buffer
      if (slotEnd - slotStart >= opts.minMinutes * 60_000) {
        out.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          minutes: Math.floor((slotEnd - slotStart) / 60_000),
        })
      }
      cursor = Math.max(cursor, b.end.getTime() + buffer)
    }

    const tail = to.getTime() - cursor
    if (tail >= opts.minMinutes * 60_000) {
      out.push({ start: new Date(cursor), end: new Date(to), minutes: Math.floor(tail / 60_000) })
    }
  }

  return out
}

export type GridBlock = {
  kind: 'busy' | 'free'
  /** Số phút tính từ đầu khung giờ trong ngày — view chỉ việc quy ra %  */
  startMin: number
  endMin: number
  minutes: number
  /** "07:00–09:00" */
  label: string
}

export type GridDay = {
  key: string
  weekday: string
  /**
   * "16/08" — ghép tay, KHÔNG dùng Intl.
   *
   * `vi-VN` nối ngày-tháng bằng dấu `-` ("16-08"). Ghép tay để dấu phân cách luôn
   * là `/` đúng như thiết kế, và để view khỏi phải cắt chuỗi do locale sinh ra.
   */
  dayLabel: string
  isToday: boolean
  blocks: GridBlock[]
}

/**
 * Dựng dữ liệu cho lưới tuần: mỗi ngày một cột, mỗi khoảng bận/rảnh một khối.
 *
 * Tính hết ở SERVER và trả về phần trăm/phút thuần. View không được tự tính lại từ
 * `Date`: server và trình duyệt có thể khác múi giờ, và lúc đó khối sẽ vẽ lệch so
 * với chính con số giờ in bên cạnh nó.
 */
export function buildWeekGrid(busy: BusySlot[], opts: WindowOpts): GridDay[] {
  const merged = mergeBusy(busy)
  const free = findFreeSlots(busy, opts)
  const spanMin = (opts.dayEndHour - opts.dayStartHour) * 60

  const weekdayFmt = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' })
  const timeFmt = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

  const todayKey = new Date().toDateString()
  const days: GridDay[] = []

  for (let d = 0; d < opts.days; d++) {
    const day = new Date()
    day.setDate(day.getDate() + d)

    const from = new Date(day)
    from.setHours(opts.dayStartHour, 0, 0, 0)
    const to = new Date(day)
    to.setHours(opts.dayEndHour, 0, 0, 0)

    /** Cắt một khoảng vào đúng khung giờ trong ngày; null nếu nằm ngoài hẳn. */
    const clip = (s: Date, e: Date, kind: GridBlock['kind']): GridBlock | null => {
      const start = Math.max(s.getTime(), from.getTime())
      const end = Math.min(e.getTime(), to.getTime())
      if (end <= start) return null
      const startMin = Math.round((start - from.getTime()) / 60_000)
      const endMin = Math.round((end - from.getTime()) / 60_000)
      return {
        kind,
        startMin: Math.max(0, Math.min(spanMin, startMin)),
        endMin: Math.max(0, Math.min(spanMin, endMin)),
        minutes: Math.round((end - start) / 60_000),
        label: `${timeFmt.format(new Date(start))}–${timeFmt.format(new Date(end))}`,
      }
    }

    const blocks = [
      ...merged.map((b) => clip(b.start, b.end, 'busy')),
      ...free.map((f) => clip(f.start, f.end, 'free')),
    ]
      .filter((b): b is GridBlock => b !== null && b.endMin > b.startMin)
      .sort((a, b) => a.startMin - b.startMin)

    days.push({
      key: day.toDateString(),
      weekday: weekdayFmt.format(day),
      dayLabel: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`,
      isToday: day.toDateString() === todayKey,
      blocks,
    })
  }

  return days
}
