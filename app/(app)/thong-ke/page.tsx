import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { BarChart, HorizontalBars, RadarChart } from '@/components/charts/charts'
import { ChevronRightIcon, ClockIcon, FlagIcon } from '@/components/shell/icons'
import { getOverallStats } from '@/lib/results'
import { getIdentity } from '@/lib/session'
import { formatDate, formatDuration, formatScore } from '@/lib/format'
import { SKILL_LABELS, type Skill } from '@/lib/enums'

export const metadata: Metadata = {
  title: 'Thống kê của bạn',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const { userId, guestId } = await getIdentity()
  const stats = await getOverallStats(guestId, userId)

  if (!stats || stats.attempts.length === 0) {
    return (
      <>
        <PageHeader title="Thống kê" subtitle="Tiến bộ của bạn qua các lần làm đề." />
        <div className="panel p-12 text-center">
          <p className="text-[18px] font-medium">Bạn chưa hoàn thành bài thi nào.</p>
          <p className="mt-2 text-[15.5px] text-muted">
            Làm một đề bất kỳ để bắt đầu theo dõi tiến bộ, điểm mạnh và điểm yếu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/de-thi" className="btn-primary">
              Chọn đề để làm
              <ChevronRightIcon size={16} />
            </Link>
            {/* Thống kê chỉ tính bài ĐÃ NỘP, nên "chưa có gì" ở đây không có nghĩa
                là chưa làm gì — lượt đang dở nằm bên /bai-lam. */}
            <Link href="/bai-lam" className="btn-secondary">
              Xem bài đã làm
            </Link>
          </div>
        </div>
      </>
    )
  }

  const latest = stats.attempts[stats.attempts.length - 1]

  return (
    <>
      <PageHeader
        title="Thống kê"
        subtitle="Tiến bộ của bạn qua các lần làm đề."
        actions={
          <div className="pill bg-pink-soft text-pink">
            <FlagIcon size={13} />
            Chuỗi {stats.streak} ngày
          </div>
        }
      />

      {/* Số liệu tổng */}
      <section className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard tone="bg-mint" label="Đề đã làm" value={String(stats.attempts.length)} />
        <StatCard tone="bg-rose" label="Tổng thời gian" value={formatDuration(stats.totalTime)} />
        <StatCard
          tone="bg-cream"
          label="Điểm gần nhất"
          value={`${formatScore(latest.scaledScore)}/${latest.maxScale}`}
        />
        <StatCard tone="bg-blush" label="Chuỗi ngày học" value={`${stats.streak} ngày`} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Tiến bộ */}
          <section className="panel p-7">
            <h2 className="mb-1 text-[21px] font-bold">Tiến bộ theo thời gian</h2>
            <p className="mb-5 text-[14.5px] text-muted">
              Điểm quy về thang % để so sánh được giữa các kỳ thi khác thang điểm.
            </p>
            <BarChart
              data={stats.progress.map((p) => ({
                label: p.date ? formatDate(p.date).slice(0, 5) : `#${p.index}`,
                value: Math.round(p.value),
              }))}
              height={180}
              valueFormatter={(v) => `${v}%`}
            />
          </section>

          {/* Lịch sử */}
          <section className="panel p-7">
            {/* Khối này chỉ liệt kê bài ĐÃ NỘP. Lối tắt sang /bai-lam vì chỉ ở đó
                mới thấy được lượt đang làm dở và vào làm tiếp. */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[21px] font-bold">Bài đã làm</h2>
              <Link
                href="/bai-lam"
                className="btn-ghost px-3 py-1.5 text-[14px]"
              >
                Xem tất cả
                <ChevronRightIcon size={14} />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {[...stats.attempts].reverse().map((a) => (
                <Link
                  key={a.id}
                  href={`/ket-qua/${a.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 transition-colors hover:bg-purple-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-medium">{a.paperTitle}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13.5px] text-muted">
                      <span>{a.examName}</span>
                      {a.submittedAt && <span>{formatDate(a.submittedAt)}</span>}
                      <span className="flex items-center gap-1">
                        <ClockIcon size={12} />
                        {formatDuration(a.timeSpent)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <span className="text-[20px] font-bold">
                      {formatScore(a.scaledScore)}
                      <span className="text-[14px] font-normal text-muted">/{a.maxScale}</span>
                    </span>
                    <ChevronRightIcon size={16} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Radar kỹ năng */}
          {stats.skillAverages.length >= 3 && (
            <section className="panel p-7">
              <h2 className="mb-1 text-[19px] font-bold">Năng lực theo kỹ năng</h2>
              <p className="mb-3 text-[13.5px] text-muted">Tỉ lệ trả lời đúng trung bình.</p>
              <div className="flex justify-center">
                <RadarChart
                  axes={stats.skillAverages.map((s) => ({
                    label: SKILL_LABELS[s.skill as Skill],
                    value: s.rate,
                  }))}
                />
              </div>
            </section>
          )}

          {stats.skillAverages.length > 0 && stats.skillAverages.length < 3 && (
            <section className="panel p-7">
              <h2 className="mb-4 text-[19px] font-bold">Tỉ lệ đúng theo kỹ năng</h2>
              <HorizontalBars
                rows={stats.skillAverages.map((s) => ({
                  label: SKILL_LABELS[s.skill as Skill],
                  value: s.rate,
                }))}
              />
            </section>
          )}

          {/* Điểm yếu */}
          {stats.weakTags.length > 0 && (
            <section className="panel p-7">
              <h2 className="mb-1 text-[19px] font-bold">Điểm yếu cần luyện</h2>
              <p className="mb-4 text-[13.5px] text-muted">
                Dạng câu bạn sai nhiều nhất, tính trên toàn bộ bài đã làm.
              </p>
              <HorizontalBars
                rows={stats.weakTags.map((t) => ({
                  label: t.tag,
                  value: t.rate,
                  caption: `${t.wrong}/${t.total} sai`,
                }))}
              />
              <Link href="/de-thi" className="btn-secondary mt-5 w-full">
                Luyện thêm đề
              </Link>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}

function StatCard({ tone, label, value }: { tone: string; label: string; value: string }) {
  return (
    <div className={`${tone} rounded-card p-6 text-on-tone`}>
      <p className="text-[14px] text-on-tone/55">{label}</p>
      <p className="mt-1.5 text-[25px] leading-tight font-bold">{value}</p>
    </div>
  )
}
