import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/app-shell'
import { BarChart, DonutChart, HorizontalBars } from '@/components/charts/charts'
import { RingProgress } from '@/components/catalog/ring-progress'
import { ArrowUpIcon, ChevronRightIcon, ClockIcon, WarningIcon } from '@/components/shell/icons'
import { getAttemptResult } from '@/lib/results'
import { prisma } from '@/lib/db'
import { getIdentity, ownsAttempt } from '@/lib/session'
import { formatClock, formatScore } from '@/lib/format'
import { SKILL_LABELS, type Skill } from '@/lib/enums'

export const metadata: Metadata = {
  title: 'Kết quả bài thi',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = PageProps<'/ket-qua/[attemptId]'>

export default async function ResultPage({ params }: Props) {
  const { attemptId } = await params
  const { userId, guestId } = await getIdentity()

  const owner = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { userId: true, guestId: true },
  })
  if (!owner) notFound()
  // Khách chưa đăng nhập vẫn xem được kết quả của chính mình qua cookie session (F4)
  if (!ownsAttempt(owner, { userId, guestId })) notFound()

  const result = await getAttemptResult(attemptId)
  if (!result) notFound()

  const { attempt, paper, counts, maxScale, sectionScores } = result
  const scorePercent = (attempt.scaledScore / maxScale) * 100

  // Vị trí của người dùng trong phổ điểm
  const bucketSize = maxScale / result.distribution.length
  const userBucket = Math.min(
    result.distribution.length - 1,
    Math.max(0, Math.floor(attempt.scaledScore / bucketSize)),
  )

  const timeDelta = attempt.timeSpent - result.avgTimeSpent
  // Một mình thì không có phổ để xếp hạng. Xem computePercentile trong lib/scoring.
  const isAlone = attempt.cohortSize < 2

  return (
    <>
      <PageHeader
        title="Kết quả bài thi"
        subtitle={paper.title}
        actions={
          <Link href={`/ket-qua/${attemptId}/xem-lai`} className="btn-primary">
            Xem lại bài làm
            <ChevronRightIcon size={16} />
          </Link>
        }
      />

      {/* Bài do server tự đóng khi hết giờ — người dùng có quyền biết vì sao họ
          không bấm nộp mà vẫn có điểm. */}
      {attempt.autoSubmitted && (
        <div className="mb-6 flex items-start gap-3 rounded-card bg-amber-soft p-5 text-[15px] leading-relaxed text-amber">
          <WarningIcon size={18} />
          <span>
            Bài này được <strong>tự động nộp khi hết giờ</strong>. Những câu chưa kịp làm
            được tính 0 điểm.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Điểm tổng */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-card bg-mint p-7 text-center text-on-tone">
              <p className="text-[14px] font-medium text-on-tone/55">Điểm của bạn</p>
              <RingProgress
                percent={scorePercent}
                size={140}
                stroke={9}
                label={formatScore(attempt.scaledScore)}
              />
              <p className="mt-4 text-[15px] font-medium">trên thang {maxScale}</p>
              <p className="mt-1 text-[14px] text-on-tone/55">
                {counts.correct}/{counts.total - counts.ungraded} câu đúng
              </p>
            </div>

            <div className="rounded-card bg-rose p-7 text-on-tone">
              <p className="text-[14px] font-medium text-on-tone/55">Xếp hạng</p>
              {/*
                Rẽ nhánh theo SỐ NGƯỜI ĐÃ LÀM, không theo `percentile > 0`.
                Phần trăm 0 mang hai nghĩa trái ngược — "chưa có ai để so" và "thấp
                hơn tất cả mọi người" — nên bản cũ chúc mừng đúng người làm tệ nhất
                rằng họ là một trong những người đầu tiên.
              */}
              <p className="mt-3 text-[39px] leading-none font-bold">
                {isAlone ? '—' : `${Math.round(attempt.percentile)}%`}
              </p>
              <p className="mt-2 text-[15.5px] leading-relaxed">
                {isAlone
                  ? 'Bạn là người đầu tiên làm đề này — chưa có ai để so sánh.'
                  : `Bạn cao hơn ${Math.round(attempt.percentile)}% trong ${attempt.cohortSize} người đã làm đề này.`}
              </p>

              <div className="mt-5 border-t border-on-tone/15 pt-4">
                <p className="flex items-center gap-2 text-[14.5px]">
                  <ClockIcon size={16} />
                  <span>Bạn làm trong {formatClock(attempt.timeSpent)}</span>
                </p>
                {result.avgTimeSpent > 0 && (
                  <p className="mt-1.5 text-[14px] text-on-tone/60">
                    {timeDelta < 0
                      ? `Nhanh hơn trung bình ${formatClock(Math.abs(timeDelta))}`
                      : `Chậm hơn trung bình ${formatClock(timeDelta)}`}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Điểm theo kỹ năng */}
          {Object.keys(sectionScores).length > 0 && (
            <section className="panel p-7">
              <h2 className="mb-5 text-[21px] font-bold">Điểm từng kỹ năng</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {result.skillStats.map((s) => (
                  <div key={s.skill} className="rounded-2xl bg-card p-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[16px] font-semibold">
                        {SKILL_LABELS[s.skill as Skill]}
                      </span>
                      <span className="text-[21px] font-bold">
                        {formatScore(sectionScores[s.skill] ?? 0)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-pill bg-soft">
                      <div
                        className="h-full rounded-pill bg-purple"
                        style={{ width: `${s.correctRate}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[14px] text-muted">
                      {s.total - s.wrong}/{s.total} câu đúng ({Math.round(s.correctRate)}%)
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Phổ điểm */}
          <section className="panel p-7">
            <h2 className="mb-1 text-[21px] font-bold">Phổ điểm</h2>
            <p className="mb-5 text-[14.5px] text-muted">
              Vị trí của bạn được tô hồng. Chỉ tính các bài đã nộp.
            </p>
            <BarChart
              data={result.distribution.map((d) => ({
                label: `${formatScore(d.from, 1)}`,
                value: d.count,
              }))}
              highlightIndex={userBucket}
              valueFormatter={(v) => `${v} người`}
            />
          </section>

          {/* Câu sai */}
          {result.wrongQuestions.length > 0 && (
            <section className="panel p-7">
              <h2 className="mb-1 text-[21px] font-bold">
                Câu sai ({result.wrongQuestions.length})
              </h2>
              <p className="mb-5 text-[14.5px] text-muted">Nhóm theo kỹ năng và dạng câu hỏi.</p>

              <div className="flex flex-col gap-3">
                {result.wrongQuestions.slice(0, 12).map((q) => (
                  <div key={q.id} className="rounded-2xl bg-card p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-red-soft text-[14px] font-bold text-red">
                        {q.number}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[15.5px] leading-relaxed">{q.content}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-pill bg-soft px-2.5 py-0.5 text-[12.5px] text-muted-strong">
                            {SKILL_LABELS[q.skill]}
                          </span>
                          {q.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-pill bg-soft px-2.5 py-0.5 text-[12.5px] text-muted-strong"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.wrongQuestions.length > 12 && (
                <Link
                  href={`/ket-qua/${attemptId}/xem-lai?loc=sai`}
                  className="btn-secondary mt-5 w-full"
                >
                  Xem tất cả {result.wrongQuestions.length} câu sai
                </Link>
              )}
            </section>
          )}
        </div>

        {/* Cột phải */}
        <aside className="flex flex-col gap-5">
          <section className="rounded-card bg-lime p-7 text-on-tone">
            <h2 className="mb-4 text-[20px] font-bold">Tổng quan</h2>
            {/*
              Bốn phần cộng lại đúng bằng `counts.total`. Bản cũ chỉ có ba và
              "Bỏ trống" đếm theo số dòng answer, nên câu gắn cờ mà bỏ trống rơi
              nhầm sang "Sai" và vòng tròn không bao giờ cộng lại bằng tổng số câu.
            */}
            <div className="flex items-center gap-5">
              <DonutChart
                size={132}
                segments={[
                  { label: 'Đúng', value: counts.correct, color: '#B6E5CE' },
                  { label: 'Sai', value: counts.wrong, color: '#F4C4E5' },
                  { label: 'Bỏ trống', value: counts.unanswered, color: '#E6EDCF' },
                  { label: 'Chưa chấm', value: counts.ungraded, color: '#F3DFC1' },
                ]}
              />
              <dl className="flex flex-col gap-3 text-[14.5px]">
                <Legend color="#B6E5CE" label="Đúng" value={counts.correct} />
                <Legend color="#F4C4E5" label="Sai" value={counts.wrong} />
                <Legend color="#E6EDCF" label="Bỏ trống" value={counts.unanswered} />
                {counts.ungraded > 0 && (
                  <Legend color="#F3DFC1" label="Chưa chấm" value={counts.ungraded} />
                )}
              </dl>
            </div>

            {counts.ungraded > 0 && (
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-on-tone/10 p-3 text-[13.5px] leading-relaxed">
                <WarningIcon size={16} />
                <span>
                  {counts.ungraded} câu tự luận chưa được chấm tự động và không tính vào tổng
                  điểm.
                </span>
              </p>
            )}
          </section>

          {result.weakTags.length > 0 && (
            <section className="panel p-6">
              <h2 className="mb-1 text-[18px] font-bold">Bạn yếu ở đâu</h2>
              <p className="mb-4 text-[13.5px] text-muted">Tỉ lệ sai theo dạng câu hỏi.</p>
              <HorizontalBars
                rows={result.weakTags.map((t) => ({
                  label: t.tag,
                  value: t.rate,
                  caption: `${t.wrong}/${t.total} sai`,
                }))}
              />
            </section>
          )}

          <section className="panel p-6">
            <h2 className="mb-4 text-[18px] font-bold">Bước tiếp theo</h2>
            <div className="flex flex-col gap-2.5">
              <Link href={`/ket-qua/${attemptId}/xem-lai`} className="btn-secondary w-full">
                Xem lại từng câu
              </Link>
              <Link href={`/de-thi/${paper.examSlug}`} className="btn-ghost w-full justify-center">
                Làm đề {paper.examName} khác
              </Link>
              <Link href="/thong-ke" className="btn-ghost w-full justify-center">
                <ArrowUpIcon size={14} />
                Xem tiến bộ của bạn
              </Link>
            </div>
            {userId ? (
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                Kết quả đã lưu vào tài khoản của bạn.
              </p>
            ) : (
              // SPEC F6: nhắc đăng ký ở đúng lúc người dùng thấy được giá trị
              <div className="mt-5 rounded-2xl bg-purple-soft p-4">
                <p className="text-[14px] leading-relaxed text-ink/80">
                  Kết quả này đang lưu theo phiên trình duyệt. Đăng ký để giữ lại tiến độ lâu
                  dài — <strong>bài bạn đã làm sẽ được chuyển sang tài khoản</strong>, không mất
                  gì cả.
                </p>
                <Link href="/dang-ky" className="btn-primary mt-3 w-full justify-center py-2.5 text-[15px]">
                  Tạo tài khoản miễn phí
                </Link>
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span className="font-semibold">{value}</span>
      <span className="text-on-tone/60">{label}</span>
    </div>
  )
}
