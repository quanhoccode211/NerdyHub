import type { Metadata } from 'next'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shell/app-shell'
import { TestProgress } from '@/components/dashboard/test-progress'
import { LearningHours } from '@/components/dashboard/learning-hours'
import { UtilitiesIntro } from '@/components/dashboard/utilities-intro'
import { MonthCalendar } from '@/components/dashboard/month-calendar'
import { DailyTasks } from '@/components/dashboard/daily-tasks'
import { CrownIcon } from '@/components/shell/icons'
import { getExamProgress, getLearningHours } from '@/lib/dashboard'
import { getIdentity } from '@/lib/session'
import { prisma } from '@/lib/db'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'Tổng quan',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [{ userId, guestId }, session] = await Promise.all([getIdentity(), auth()])

  const [exams, hours, activeDates] = await Promise.all([
    getExamProgress(userId, guestId),
    getLearningHours(userId, guestId),
    getActiveDates(userId, guestId),
  ])

  const firstName = (session?.user?.name ?? '').trim().split(/\s+/).pop()
  const totalDone = exams.reduce((s, e) => s + e.donePapers, 0)
  const t = await getT()

  return (
    <>
      <PageHeader
        eyebrow={firstName ? t('dashboard.greeting', { name: firstName }) : t('dashboard.greetingGuest')}
        title={t(totalDone > 0 ? 'dashboard.titleContinue' : 'dashboard.titleStart')}
        badge={
          totalDone > 0 ? (
            <span className="pill bg-sky text-[13.5px] text-on-tone">
              <CrownIcon size={13} />
              {t('dashboard.doneCount', { count: totalDone })}
            </span>
          ) : null
        }
        /*
          KHÔNG có thanh công cụ ở đây nữa (bỏ theo yêu cầu).

          Trước đây là ô "Tìm đề thi…" + nút lọc, cả hai chỉ dẫn sang /de-thi —
          tức là hai lối tắt tới đúng chỗ mà tab "Kho đề" trên rail đã dẫn tới,
          đặt ngay cạnh tiêu đề trang Tổng quan. `actions` của PageHeader vẫn
          còn nguyên cho trang khác dùng.
        */
      />

      {/* Hàng trên: tiến độ + giờ luyện tập */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TestProgress exams={exams} />
        <LearningHours
          t={t}
          series={hours.series}
          bySkill={hours.bySkill}
          goalSeconds={hours.goalSeconds}
        />
      </div>

      {/* Hàng dưới: giới thiệu Tiện ích, lịch tháng, việc hôm nay */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-[320px_minmax(0,1fr)_minmax(0,1fr)]">
        <UtilitiesIntro t={t} />
        <MonthCalendar activeDates={activeDates} />
        {/* Cột cuối hẹp hơn bản timeline cũ: danh sách việc chỉ cần một cột chữ */}
        <div className="lg:col-span-2 xl:col-span-1">
          <DailyTasks />
        </div>
      </div>
    </>
  )
}

/** Các ngày có làm bài, để tô lên lịch tháng. */
async function getActiveDates(userId: string | null, guestId: string | null): Promise<string[]> {
  const owner = userId ? { userId } : guestId ? { guestId } : null
  if (!owner) return []

  const rows = await prisma.attempt.findMany({
    where: { ...owner, submittedAt: { not: null } },
    select: { submittedAt: true },
  })

  return [
    ...new Set(
      rows
        .map((r) => r.submittedAt)
        .filter((d): d is Date => d !== null)
        .map(
          (d) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        ),
    ),
  ]
}
