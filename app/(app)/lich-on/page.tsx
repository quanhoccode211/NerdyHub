import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shell/app-shell'
import { DisconnectCalendarButton } from '@/components/calendar/disconnect-button'
import { CalendarIcon, CheckIcon, ChevronRightIcon, WarningIcon } from '@/components/shell/icons'
import { WeekGrid, WeekGridLegend } from '@/components/calendar/week-grid'
import {
  buildWeekGrid,
  getBusySlots,
  getConnection,
  isCalendarConfigured,
  type GridDay,
} from '@/lib/calendar/google'

export const metadata: Metadata = {
  title: 'Lịch ôn',
  robots: { index: false, follow: false },
}

/** Đọc lịch là dữ liệu sống — không được cache. */
export const dynamic = 'force-dynamic'

/**
 * Khung giờ và độ dài tối thiểu của một khe được coi là "ôn được".
 * `bufferMinutes` chừa hai đầu mỗi khoảng bận — xem `findFreeSlots`.
 */
const WINDOW = { days: 7, dayStartHour: 7, dayEndHour: 22, minMinutes: 45, bufferMinutes: 10 }

const ERROR_TEXT: Record<string, string> = {
  'chua-cau-hinh': 'Máy chủ chưa có Google OAuth client. Xem docs/google-oauth-setup.md.',
  'tu-choi': 'Bạn đã huỷ ở màn hình cấp quyền của Google. Chưa có gì được kết nối.',
  'state-sai': 'Phiên kết nối không khớp. Thử lại từ đầu cho chắc.',
  'thieu-code': 'Google không trả về mã uỷ quyền. Thử lại giúp mình.',
  'thieu-refresh-token':
    'Google không cấp refresh token nên kết nối sẽ chết sau một giờ. Vào Tài khoản Google → Bảo mật, gỡ quyền của app rồi kết nối lại.',
  'doi-token-that-bai': 'Không đổi được mã uỷ quyền sang token. Thử lại sau ít phút.',
}

// Nhãn ngày/giờ của lưới do `buildWeekGrid` định dạng sẵn ở server — xem ghi chú
// về múi giờ trong lib/calendar/google.ts.

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

        {/*
          Chữ của mỗi gạch đầu dòng phải nằm TRONG MỘT <span>.

          `<li>` là flex container, mà trong flex thì MỖI đoạn text và MỖI thẻ inline
          thành một flex item riêng. Để trần thì "…người tham dự", <strong>không</strong>
          và "được gửi về máy chủ." là ba item khác nhau: mỗi item tự xuống dòng theo
          bề rộng của riêng nó, và `gap-2` chèn khoảng trắng vào giữa. Kết quả là chữ
          rời rạc, ngắt sai chỗ và thứ tự đọc bị vỡ.

          Bọc lại thành đúng hai item — icon và khối chữ — thì chữ chảy như văn bản
          bình thường trở lại.
        */}
        <ul className="mt-4 flex max-w-[560px] flex-col gap-2 text-[14.5px] leading-relaxed text-muted-strong">
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            <span>
              Chỉ xin quyền <strong className="font-semibold text-ink">chỉ đọc</strong>. Nerdy Hub
              không tạo, sửa hay xoá bất kỳ sự kiện nào.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            <span>
              Chỉ lấy mốc bận/rảnh. Tiêu đề, mô tả và người tham dự{' '}
              <strong className="font-semibold text-ink">không</strong> được gửi về máy chủ.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            <span>Token lưu dạng mã hoá AES-256-GCM, và bị xoá hẳn khi bạn ngắt kết nối.</span>
          </li>
        </ul>

        <a href="/api/calendar/connect" className="btn-primary mt-6">
          {conn.status === 'broken' ? 'Kết nối lại' : 'Kết nối Google Calendar'}
          <ChevronRightIcon size={16} />
        </a>
      </section>
    )
  }

  let week: GridDay[]
  let freeCount = 0
  try {
    const now = new Date()
    const until = new Date(now)
    until.setDate(until.getDate() + WINDOW.days)
    const busy = await getBusySlots(conn.accessToken, now, until)
    week = buildWeekGrid(busy, WINDOW)
    freeCount = week.reduce((n, d) => n + d.blocks.filter((b) => b.kind === 'free').length, 0)
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

  /*
    LỊCH ĐỨNG ĐẦU TRANG. Đây là thứ người dùng vào đây để xem; thanh trạng thái kết
    nối là việc quản trị, mỗi tháng đụng tới một lần — nó xuống cuối.
  */
  return (
    <>
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.01em]">
              Khoảng trống {WINDOW.days} ngày tới
            </h2>
            <p className="mt-1 text-[14px] text-muted">
              Trong khung {WINDOW.dayStartHour}:00–{WINDOW.dayEndHour}:00, từ{' '}
              {humanLength(WINDOW.minMinutes)} trở lên.
            </p>
          </div>
          <WeekGridLegend bufferMinutes={WINDOW.bufferMinutes} />
        </div>

        <div className="mt-5">
          <WeekGrid
            days={week}
            dayStartHour={WINDOW.dayStartHour}
            dayEndHour={WINDOW.dayEndHour}
          />
        </div>

        {freeCount === 0 && (
          <div className="panel mt-4 px-6 py-8 text-center">
            <p className="text-[15px] font-medium">Tuần tới lịch bạn kín rồi.</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              Không có khoảng trống nào dài từ {humanLength(WINDOW.minMinutes)} trong khung giờ trên.
            </p>
          </div>
        )}

        <Link href="/de-thi" className="btn-primary mt-6">
          Chọn đề cho khung giờ trống
          <ChevronRightIcon size={16} />
        </Link>
      </section>

      <section className="card mt-5 flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold">
          <CheckIcon size={16} className="flex-none text-good" />
          <span>Đã kết nối Google Calendar</span>
        </p>
        <DisconnectCalendarButton />
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
