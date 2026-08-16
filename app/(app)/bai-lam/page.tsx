import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { ChevronRightIcon, ClockIcon } from '@/components/shell/icons'
import { prisma } from '@/lib/db'
import { getIdentity } from '@/lib/session'
import { getStrategy } from '@/lib/scoring'
import { formatDateTime, formatDuration, formatScore } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Bài đã làm',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AttemptsPage() {
  const { userId, guestId } = await getIdentity()

  // Đã đăng nhập thì đọc theo tài khoản; chưa thì theo cookie phiên khách
  const owner = userId ? { userId } : guestId ? { guestId } : null

  const attempts = owner
    ? await prisma.attempt.findMany({
        where: owner,
        orderBy: { startedAt: 'desc' },
        include: { paper: { include: { exam: true } } },
      })
    : []

  const inProgress = attempts.filter((a) => a.status === 'IN_PROGRESS')
  const finished = attempts.filter((a) => a.status !== 'IN_PROGRESS')
  // Server Component chạy một lần mỗi request — đọc đồng hồ ở đây là đúng chỗ,
  // và cần thiết để biết lượt làm dở đã quá hạn hay chưa.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  return (
    <>
      <PageHeader title="Bài đã làm" subtitle="Toàn bộ lượt làm bài trong phiên trình duyệt này." />

      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-[21px] font-bold">Đang làm dở</h2>
          <div className="flex flex-col gap-3">
            {inProgress.map((a) => {
              const expired = a.expiresAt.getTime() <= now
              return (
                <Link
                  key={a.id}
                  href={`/thi/${a.id}`}
                  className="rounded-card bg-cream p-5 text-on-tone transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-semibold">{a.paper.title}</p>
                      <p className="mt-1 text-[14px] text-on-tone/60">
                        {a.paper.exam.name} · bắt đầu {formatDateTime(a.startedAt)}
                        {expired && ' · đã hết giờ'}
                      </p>
                    </div>
                    <span className="btn-secondary flex-none px-4 py-2 text-[14.5px]">
                      {expired ? 'Xem kết quả' : 'Làm tiếp'}
                      <ChevronRightIcon size={15} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-[21px] font-bold">Đã nộp</h2>

        {finished.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-[17px] font-medium">Chưa có bài nào được nộp.</p>
            <Link href="/de-thi" className="btn-primary mx-auto mt-5">
              Chọn đề để làm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {finished.map((a) => {
              const max = getStrategy(a.paper.exam.slug).maxScale
              return (
                <Link
                  key={a.id}
                  href={`/ket-qua/${a.id}`}
                  className="panel flex items-center justify-between gap-4 p-5 transition-colors hover:bg-purple-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-medium">{a.paper.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[14px] text-muted">
                      <span>{a.paper.exam.name}</span>
                      {a.submittedAt && <span>{formatDateTime(a.submittedAt)}</span>}
                      <span className="flex items-center gap-1">
                        <ClockIcon size={12} />
                        {formatDuration(a.timeSpent)}
                      </span>
                      <span className="rounded-pill bg-soft px-2 py-0.5 text-[12.5px]">
                        {a.mode === 'EXAM' ? 'Thi thật' : 'Luyện tập'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <span className="text-[20px] font-bold">
                      {formatScore(a.scaledScore)}
                      <span className="text-[14px] font-normal text-muted">/{max}</span>
                    </span>
                    <ChevronRightIcon size={16} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
