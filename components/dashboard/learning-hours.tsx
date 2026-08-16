import type { DayHours, SkillTime } from '@/lib/dashboard'
import { SKILL_LABELS, type Skill } from '@/lib/enums'
import { CardHeader } from '../shell/app-shell'
import { ChartIcon, ChevronDownIcon, DotsIcon, SlidersIcon, TimerIcon } from '../shell/icons'

/**
 * "Giờ luyện tập" — khối Learning Hours.
 *
 * Cột dạng viên thuốc bo tròn hết cỡ, cột hôm nay tô đen đặc, đường ngắt quãng
 * đánh dấu mục tiêu ngày. Vẽ bằng SVG/CSS thuần, không kéo thêm thư viện biểu đồ.
 */

function formatHm(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m}p`
  return m === 0 ? `${h}h` : `${h}h${m}p`
}

export function LearningHours({
  series,
  bySkill,
  goalSeconds,
}: {
  series: DayHours[]
  bySkill: SkillTime[]
  goalSeconds: number
}) {
  const maxSeconds = Math.max(goalSeconds * 1.35, ...series.map((d) => d.seconds), 1)
  // Trục y theo mốc giờ tròn
  const topHours = Math.max(1, Math.ceil(maxSeconds / 3600))
  const axisMax = topHours * 3600
  const ticks = Array.from({ length: topHours }, (_, i) => topHours - i)
  const goalPercent = (goalSeconds / axisMax) * 100

  const CHART_H = 176

  return (
    <section className="card p-5 md:p-6">
      <CardHeader
        icon={<ChartIcon size={17} />}
        title="Giờ luyện tập"
        actions={
          <>
            <span className="pill border border-line bg-card text-[13.5px] text-muted-strong">
              6 ngày
              <ChevronDownIcon size={13} />
            </span>
            <button type="button" className="icon-circle" aria-label="Tuỳ chọn khác">
              <DotsIcon size={16} />
            </button>
            <button type="button" className="icon-circle" aria-label="Bộ lọc">
              <SlidersIcon size={16} />
            </button>
          </>
        }
      />

      <div className="flex gap-3">
        {/* Trục giờ */}
        <div
          className="flex flex-col justify-between pb-6 text-[12.5px] text-muted"
          style={{ height: CHART_H + 24 }}
        >
          {ticks.map((t) => (
            <span key={t}>{t}h</span>
          ))}
          <span>0</span>
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Đường mục tiêu */}
          <div
            className="pointer-events-none absolute right-0 left-0 flex items-center"
            style={{ bottom: 24 + (goalPercent / 100) * CHART_H }}
          >
            <div className="h-px flex-1 border-t border-dashed border-ink/25" />
            <span className="ml-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[11.5px] font-semibold text-[var(--color-accent-fg)]">
              {formatHm(goalSeconds)}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2" style={{ height: CHART_H }}>
            {series.map((d) => {
              const pct = axisMax > 0 ? (d.seconds / axisMax) * 100 : 0
              // Cột luôn có chiều cao tối thiểu để giữ nhịp thị giác của hàng
              const h = Math.max(pct, 14)
              return (
                <div key={d.date} className="group relative flex flex-1 justify-center">
                  <div
                    className={`relative w-full max-w-[54px] rounded-pill transition-all ${
                      d.isToday ? 'bg-accent' : 'bg-soft'
                    }`}
                    style={{ height: `${h}%` }}
                  >
                    {!d.isToday && d.seconds > 0 && (
                      // Vòng cung mint ở đỉnh cột giống ảnh gốc
                      <span className="absolute inset-x-0 top-0 h-8 rounded-pill border-2 border-b-0 border-mint" />
                    )}
                    {d.isToday && (
                      <span className="absolute inset-x-0 top-3 flex justify-center text-[var(--color-accent-fg)]">
                        <TimerIcon size={15} />
                      </span>
                    )}
                  </div>

                  <span className="pointer-events-none absolute -top-7 hidden rounded-lg bg-accent px-2 py-1 text-[12px] whitespace-nowrap text-[var(--color-accent-fg)] group-hover:block">
                    {formatHm(d.seconds)}
                  </span>
                </div>
              )
            })}
          </div>

          {/*
            Hàng nhãn ngày. `whitespace-nowrap` khiến mỗi nhãn có min-content
            bằng đúng bề rộng chữ, mà `flex-1` không co xuống dưới min-content —
            nên bảy nhãn quá khổ sẽ ĐẨY RỘNG cả trang chứ không tự xuống dòng.
            Ở 375px, cỡ 12.5px của font đơn cách vừa đúng tràn ra ngoài khung.
            Hạ một nấc dưới sm cho có dư địa; từ sm trở lên thừa chỗ, giữ 12.5px.
          */}
          <div className="mt-2.5 flex justify-between gap-2">
            {series.map((d) => (
              <span
                key={d.date}
                className={`flex-1 text-center text-[11px] whitespace-nowrap sm:text-[12.5px] ${
                  d.isToday ? 'font-semibold text-ink' : 'text-muted'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chip thống kê theo kỹ năng */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {bySkill.length > 0 ? (
          bySkill.map((s) => (
            <div
              key={s.skill}
              className="flex items-center gap-2.5 rounded-2xl border border-line p-2.5"
            >
              <span className="chip-icon bg-mint-soft">
                <TimerIcon size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">
                  {SKILL_LABELS[s.skill as Skill]}
                </p>
                <p className="text-[13px] text-muted">{formatHm(s.seconds)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full rounded-2xl border border-line p-4 text-center text-[14px] text-muted">
            Làm một đề để bắt đầu đếm giờ luyện tập.
          </p>
        )}
      </div>
    </section>
  )
}
