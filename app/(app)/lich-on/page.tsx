import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shell/app-shell'
import { DisconnectCalendarButton } from '@/components/calendar/disconnect-button'
import { CalendarIcon, CheckIcon, ChevronRightIcon, WarningIcon } from '@/components/shell/icons'
import {
  findFreeSlots,
  getBusySlots,
  getConnection,
  isCalendarConfigured,
  type FreeSlot,
} from '@/lib/calendar/google'

export const metadata: Metadata = {
  title: 'Lịch ôn',
  robots: { index: false, follow: false },
}

/** Đọc lịch là dữ liệu sống — không được cache. */
export const dynamic = 'force-dynamic'

/** Khung giờ và độ dài tối thiểu của một khe được coi là "ôn được". */
const WINDOW = { days: 7, dayStartHour: 7, dayEndHour: 22, minMinutes: 45 }

const ERROR_TEXT: Record<string, string> = {
  'chua-cau-hinh': 'Máy chủ chưa có Google OAuth client. Xem docs/google-oauth-setup.md.',
  'tu-choi': 'Bạn đã huỷ ở màn hình cấp quyền của Google. Chưa có gì được kết nối.',
  'state-sai': 'Phiên kết nối không khớp. Thử lại từ đầu cho chắc.',
  'thieu-code': 'Google không trả về mã uỷ quyền. Thử lại giúp mình.',
  'thieu-refresh-token':
    'Google không cấp refresh token nên kết nối sẽ chết sau một giờ. Vào Tài khoản Google → Bảo mật, gỡ quyền của app rồi kết nối lại.',
  'doi-token-that-bai': 'Không đổi được mã uỷ quyền sang token. Thử lại sau ít phút.',
}

const dayFmt = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
const timeFmt = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

function humanLength(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h} giờ`
  return `${h} giờ ${m} phút`
}

export default async function StudyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ loi?: string; ok?: string }>
}) {
  const [{ loi, ok }, session] = await Promise.all([searchParams, auth()])

  return (
    <>
      <PageHeader
        title="Lịch ôn"
        subtitle="Kết nối Google Calendar để tìm những khoảng trống trong tuần mà ôn bài."
      />

      {loi && (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-amber-soft px-4 py-3 text-[14.5px] leading-relaxed text-amber">
          <WarningIcon size={17} />
          {ERROR_TEXT[loi] ?? 'Có lỗi khi kết nối lịch. Thử lại giúp mình.'}
        </p>
      )}
      {ok && !loi && (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-good-soft px-4 py-3 text-[14.5px] leading-relaxed text-good">
          <CheckIcon size={17} />
          Đã kết nối Google Calendar.
        </p>
      )}

      <CalendarSection userId={session?.user?.id ?? null} />
    </>
  )
}

async function CalendarSection({ userId }: { userId: string | null }) {
  if (!isCalendarConfigured()) {
    return (
      <Notice
        title="Máy chủ chưa cấu hình Google OAuth"
        body="Cần GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong .env, và bật Google Calendar API. Các bước nằm ở docs/google-oauth-setup.md."
      />
    )
  }

  if (!userId) {
    return (
      <Notice
        title="Đăng nhập để kết nối lịch"
        body="Lịch gắn với tài khoản, nên phần này cần đăng nhập. Làm đề thì vẫn không cần."
        action={
          <Link href="/dang-nhap" className="btn-primary mx-auto mt-6">
            Đăng nhập
            <ChevronRightIcon size={16} />
          </Link>
        }
      />
    )
  }

  const conn = await getConnection(userId)

  if (conn.status !== 'ok') {
    return (
      <section className="card p-6 md:p-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-purple-soft text-purple">
          <CalendarIcon size={28} />
        </span>
        <h2 className="mt-5 text-[21px] font-bold">
          {conn.status === 'broken' ? 'Kết nối đã dừng' : 'Kết nối Google Calendar'}
        </h2>

        {conn.status === 'broken' && (
          <p className="mt-2 text-[15px] leading-relaxed text-amber">{conn.reason}</p>
        )}

        <p className="mt-3 max-w-[560px] text-[15.5px] leading-relaxed text-muted-strong">
          Nerdy Hub đọc các khoảng <strong className="font-semibold text-ink">đã bận</strong> trong
          lịch của bạn để chỉ ra chỗ còn trống mà ôn bài.
        </p>

        <ul className="mt-4 flex max-w-[560px] flex-col gap-2 text-[14.5px] leading-relaxed text-muted-strong">
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            Chỉ xin quyền <strong className="font-semibold text-ink">chỉ đọc</strong>. Nerdy Hub
            không tạo, sửa hay xoá bất kỳ sự kiện nào.
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            Chỉ lấy mốc bận/rảnh. Tiêu đề, mô tả và người tham dự{' '}
            <strong className="font-semibold text-ink">không</strong> được gửi về máy chủ.
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            Token lưu dạng mã hoá AES-256-GCM, và bị xoá hẳn khi bạn ngắt kết nối.
          </li>
        </ul>

        <a href="/api/calendar/connect" className="btn-primary mt-6">
          {conn.status === 'broken' ? 'Kết nối lại' : 'Kết nối Google Calendar'}
          <ChevronRightIcon size={16} />
        </a>
      </section>
    )
  }

  let slots: FreeSlot[]
  try {
    const now = new Date()
    const until = new Date(now)
    until.setDate(until.getDate() + WINDOW.days)
    const busy = await getBusySlots(conn.accessToken, now, until)
    slots = findFreeSlots(busy, WINDOW)
  } catch {
    return (
      <Notice
        title="Không đọc được lịch"
        body="Google từ chối yêu cầu. Thường là do Google Calendar API chưa được bật trong project, hoặc quyền vừa bị thu hồi."
        action={
          <a href="/api/calendar/connect" className="btn-primary mx-auto mt-6">
            Cấp quyền lại
            <ChevronRightIcon size={16} />
          </a>
        }
      />
    )
  }

  // Gom theo ngày để đọc cho ra một tuần, không phải một danh sách phẳng
  const byDay = new Map<string, FreeSlot[]>()
  for (const s of slots) {
    const k = dayFmt.format(s.start)
    byDay.set(k, [...(byDay.get(k) ?? []), s])
  }

  return (
    <>
      <section className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <CheckIcon size={16} className="flex-none text-good" />
            Đã kết nối Google Calendar
          </p>
          <p className="mt-1 text-[14px] text-muted">
            Chỉ đọc mốc bận/rảnh, không đọc nội dung sự kiện.
          </p>
        </div>
        <DisconnectCalendarButton />
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">
          Khoảng trống {WINDOW.days} ngày tới
        </h2>
        <p className="mt-1 text-[14px] text-muted">
          Trong khung {WINDOW.dayStartHour}:00–{WINDOW.dayEndHour}:00, từ{' '}
          {humanLength(WINDOW.minMinutes)} trở lên.
        </p>

        {byDay.size === 0 ? (
          <div className="panel mt-4 px-6 py-10 text-center">
            <p className="text-[15px] font-medium">Tuần tới lịch bạn kín rồi.</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              Không có khoảng trống nào dài từ {humanLength(WINDOW.minMinutes)} trong khung giờ trên.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {[...byDay.entries()].map(([day, daySlots]) => (
              <div key={day}>
                <h3 className="text-[14px] font-semibold text-muted-strong capitalize">{day}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {daySlots.map((s) => (
                    <li
                      key={s.start.toISOString()}
                      className="rounded-pill bg-soft px-3.5 py-2 text-[14px]"
                    >
                      <span className="font-semibold">
                        {timeFmt.format(s.start)}–{timeFmt.format(s.end)}
                      </span>
                      <span className="ml-2 text-muted">{humanLength(s.minutes)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <Link href="/de-thi" className="btn-primary mt-6">
          Chọn đề cho khung giờ trống
          <ChevronRightIcon size={16} />
        </Link>
      </section>
    </>
  )
}

function Notice({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="panel p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-soft text-purple">
        <CalendarIcon size={30} />
      </span>
      <h2 className="mt-5 text-[21px] font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-[15.5px] leading-relaxed text-muted-strong">
        {body}
      </p>
      {action}
    </div>
  )
}
