import type { Metadata } from 'next'
import { Suspense } from 'react'
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
import { getLocale, getT, type Translator } from '@/lib/i18n/server'

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

// Nhãn ngày/giờ của lưới do `buildWeekGrid` định dạng sẵn ở server — xem ghi chú
// về múi giờ trong lib/calendar/google.ts.

function humanLength(minutes: number, t: Translator): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return t('time.minutes', { m })
  if (m === 0) return t('time.hours', { h })
  return t('time.hoursMinutes', { h, m })
}

export default async function StudyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ loi?: string; ok?: string }>
}) {
  const [{ loi, ok }, session, t] = await Promise.all([searchParams, auth(), getT()])

  const ERROR_TEXT: Record<string, string> = {
    'chua-cau-hinh': t('schedule.err.notConfigured'),
    'tu-choi': t('schedule.err.denied'),
    'state-sai': t('schedule.err.state'),
    'thieu-code': t('schedule.err.noCode'),
    'thieu-refresh-token': t('schedule.err.noRefresh'),
    'doi-token-that-bai': t('schedule.err.tokenFailed'),
  }

  return (
    <>
      <PageHeader
        title={t('schedule.title')}
        subtitle={t('schedule.subtitle')}
      />

      {loi && (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-amber-soft px-4 py-3 text-[14.5px] leading-relaxed text-amber">
          <WarningIcon size={17} />
          {ERROR_TEXT[loi] ?? t('schedule.err.fallback')}
        </p>
      )}
      {ok && !loi && (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-good-soft px-4 py-3 text-[14.5px] leading-relaxed text-good">
          <CheckIcon size={17} />
          {t('schedule.ok')}
        </p>
      )}

      <CalendarSection userId={session?.user?.id ?? null} t={t} />
    </>
  )
}

async function CalendarSection({ userId, t }: { userId: string | null; t: Translator }) {
  if (!isCalendarConfigured()) {
    return (
      <Notice
        title={t('schedule.unconfiguredTitle')}
        body={t('schedule.unconfiguredBody')}
      />
    )
  }

  if (!userId) {
    return (
      <Notice
        title={t('schedule.loginTitle')}
        body={t('schedule.loginBody')}
        action={
          <Link href="/dang-nhap" className="btn-primary mx-auto mt-6">
            {t('schedule.loginBtn')}
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
          {conn.status === 'broken' ? t('schedule.connBroken') : t('schedule.connTitle')}
        </h2>

        {conn.status === 'broken' && (
          <p className="mt-2 text-[15px] leading-relaxed text-amber">{conn.reason}</p>
        )}

        <p className="mt-3 max-w-[560px] text-[15.5px] leading-relaxed text-muted-strong">
          {t('schedule.connDesc')}
        </p>

        {/*
          Chữ của mỗi gạch đầu dòng phải nằm TRONG MỘT <span>.

          `<li>` là flex container, mà trong flex thì MỖI đoạn text và MỖI thẻ inline
          thành một flex item riêng. Để trần thì mỗi mẩu chữ tự xuống dòng theo bề
          rộng của riêng nó, và `gap-2` chèn khoảng trắng vào giữa câu. Kết quả là
          chữ rời rạc, ngắt sai chỗ và thứ tự đọc bị vỡ.

          Bọc lại thành đúng hai item — icon và khối chữ — thì chữ chảy như văn bản
          bình thường trở lại.
        */}
        <ul className="mt-4 flex max-w-[560px] flex-col gap-2 text-[14.5px] leading-relaxed text-muted-strong">
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            <span>{t('schedule.benefit1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            <span>{t('schedule.benefit2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon size={16} className="mt-1 flex-none text-good" />
            <span>{t('schedule.benefit3')}</span>
          </li>
        </ul>

        <a href="/api/calendar/connect" className="btn-primary mt-6">
          {conn.status === 'broken' ? t('schedule.reconnectBtn') : t('schedule.connectBtn')}
          <ChevronRightIcon size={16} />
        </a>
      </section>
    )
  }

  /*
    LỊCH ĐỨNG ĐẦU TRANG. Đây là thứ người dùng vào đây để xem; thanh trạng thái kết
    nối là việc quản trị, mỗi tháng đụng tới một lần — nó xuống cuối.
  */
  return (
    <>
      {/*
        RANH GIỚI SUSPENSE ĐẶT Ở ĐÂY, không cao hơn.

        Mọi thứ phía trên — kiểm cấu hình, kiểm đăng nhập, đọc kết nối trong DB —
        đều là truy vấn cục bộ, xong trong vài mili giây. Riêng `getBusySlots`
        phải đi hỏi máy chủ Google, và đó là lý do trang này khựng: không có ranh
        giới thì React giữ NGUYÊN trang cũ cho tới khi Google trả lời, nên cú
        bấm tab đọc ra như máy bị treo. Tệ hơn nữa từ khi có hiệu ứng trượt —
        `SlideLink` giữ khung hình tới lúc route mới commit, nên toàn bộ thời
        gian chờ Google biến thành một khung đứng im.

        Có ranh giới thì route commit ngay với khung + khung xương, hiệu ứng
        trượt chạy trọn vẹn, và lưới lịch chảy vào sau khi Google trả lời.

        KHÔNG cache kết quả: `dynamic = 'force-dynamic'` phía trên là chủ ý —
        lịch là dữ liệu sống, hiện một tuần bận cũ là sai theo hướng nguy hiểm
        nhất vì nó gợi ý ôn đúng vào giờ đang có việc.
      */}
      <Suspense fallback={<WeekGridSkeleton t={t} />}>
        <WeekGridPanel accessToken={conn.accessToken} t={t} />
      </Suspense>

      <section className="card mt-5 flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold">
          <CheckIcon size={16} className="flex-none text-good" />
          <span>{t('schedule.ok')}</span>
        </p>
        <DisconnectCalendarButton />
      </section>
    </>
  )
}

/** Phần chờ Google: tách riêng để `<Suspense>` có cái mà bọc. */
async function WeekGridPanel({ accessToken, t }: { accessToken: string; t: Translator }) {
  const locale = await getLocale()
  let week: GridDay[]
  let freeCount = 0
  try {
    const now = new Date()
    const until = new Date(now)
    until.setDate(until.getDate() + WINDOW.days)
    const busy = await getBusySlots(accessToken, now, until)
    week = buildWeekGrid(busy, WINDOW, locale)
    freeCount = week.reduce((n, d) => n + d.blocks.filter((b) => b.kind === 'free').length, 0)
  } catch {
    return (
      <Notice
        title={t('schedule.readErrTitle')}
        body={t('schedule.readErrBody')}
        action={
          <a href="/api/calendar/connect" className="btn-primary mx-auto mt-6">
            {t('schedule.grantAgain')}
            <ChevronRightIcon size={16} />
          </a>
        }
      />
    )
  }

  return (
    <>
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.01em]">
              {t('schedule.gridTitle', { days: WINDOW.days })}
            </h2>
            <p className="mt-1 text-[14px] text-muted">
              {t('schedule.gridDesc', { start: WINDOW.dayStartHour, end: WINDOW.dayEndHour, min: humanLength(WINDOW.minMinutes, t) })}
            </p>
          </div>
          <WeekGridLegend bufferMinutes={WINDOW.bufferMinutes} t={t} />
        </div>

        <div className="mt-5">
          <WeekGrid
            days={week}
            dayStartHour={WINDOW.dayStartHour}
            dayEndHour={WINDOW.dayEndHour}
            t={t}
          />
        </div>

        {freeCount === 0 && (
          <div className="panel mt-4 px-6 py-8 text-center">
            <p className="text-[15px] font-medium">{t('schedule.gridEmptyTitle')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              {t('schedule.gridEmptyDesc', { min: humanLength(WINDOW.minMinutes, t) })}
            </p>
          </div>
        )}

        <Link href="/de-thi" className="btn-primary mt-6">
          {t('schedule.pickPaper')}
          <ChevronRightIcon size={16} />
        </Link>
      </section>
    </>
  )
}

/**
 * Khung xương trong lúc chờ Google.
 *
 * Dựng ĐÚNG bằng khung thật: cùng thẻ `card`, cùng tiêu đề, và ô chờ cao đúng
 * `(dayEndHour - dayStartHour) * 44px` như WeekGrid. Khung xương thấp hơn lưới
 * thật thì lúc dữ liệu về, cả trang giật nảy một cái xuống dưới — đổi một cú
 * khựng lấy một cú nhảy thì chẳng lời gì.
 */
function WeekGridSkeleton({ t }: { t: Translator }) {
  return (
    <section className="card p-5 md:p-6" aria-busy="true">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">
            {t('schedule.gridTitle', { days: WINDOW.days })}
          </h2>
          <p className="mt-1 text-[14px] text-muted">{t('schedule.reading')}</p>
        </div>
        <WeekGridLegend bufferMinutes={WINDOW.bufferMinutes} t={t} />
      </div>

      <div
        className="skeleton-block mt-5 rounded-xl"
        style={{ height: `${(WINDOW.dayEndHour - WINDOW.dayStartHour) * 44 + 28}px` }}
      />
    </section>
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
    <section className="panel p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-soft text-purple">
        <CalendarIcon size={30} />
      </span>
      <h2 className="mt-5 text-[21px] font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-[15.5px] leading-relaxed text-muted-strong">
        {body}
      </p>
      {action}
    </section>
  )
}
