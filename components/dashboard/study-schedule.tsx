import Link from 'next/link'
import type { ScheduleItem } from '@/lib/dashboard'
import { CardHeader } from '../shell/app-shell'
import { ChevronDownIcon, DotsIcon, PlusIcon, TasksIcon } from '../shell/icons'

/**
 * "Lịch ôn" — khối Class Schedule của ảnh tham chiếu: timeline ngang, mỗi buổi
 * là một viên thuốc màu đặt đúng ngày, kèm % hoàn thành. Đường đứt dọc là hôm nay.
 */

/** Gradient đọc từ CSS variable để có bản dịu hơn ở dark mode — xem globals.css */
const TONE_BG: Record<ScheduleItem['tone'], string> = {
  mint: 'var(--tile-mint)',
  peri: 'var(--tile-peri)',
  sky: 'var(--tile-sky)',
}

export function StudySchedule({
  items,
  dayLabels,
  todayIndex,
}: {
  items: ScheduleItem[]
  dayLabels: string[]
  todayIndex: number
}) {
  const cols = dayLabels.length
  const ROW_H = 46

  return (
    <section className="card p-5 md:p-6">
      <CardHeader
        icon={<TasksIcon size={17} />}
        title="Lịch ôn"
        meta={
          <span className="pill bg-soft text-[13px] text-muted-strong">
            6 ngày
            <ChevronDownIcon size={13} />
          </span>
        }
        actions={
          <>
            <Link href="/lich-on" className="icon-circle" aria-label="Thêm buổi ôn">
              <PlusIcon size={16} />
            </Link>
            <button type="button" className="icon-circle" aria-label="Tuỳ chọn khác">
              <DotsIcon size={16} />
            </button>
          </>
        }
      />

      {items.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center px-6 py-10 text-center">
          <p className="text-[15px] font-medium">Chưa có buổi ôn nào trong 6 ngày qua.</p>
          <p className="mt-1.5 max-w-[320px] text-[14px] leading-relaxed text-muted">
            Mỗi lần bạn làm đề, buổi đó sẽ hiện ở đây đúng ngày và giờ thực tế.
          </p>
          <Link href="/de-thi" className="btn-secondary mt-4 py-2 text-[14px]">
            Chọn đề để làm
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Đường dọc đánh dấu hôm nay */}
          <div
            className="pointer-events-none absolute top-0 bottom-7 w-px border-l border-dashed border-ink/25"
            style={{ left: `${((todayIndex + 0.5) / cols) * 100}%` }}
          >
            <span className="absolute -top-1 -left-[3px] h-1.5 w-1.5 rounded-full bg-accent" />
          </div>

          <div
            className="relative"
            style={{ height: Math.max(items.length, 3) * ROW_H }}
            role="list"
            aria-label="Các buổi ôn gần đây"
          >
            {items.map((item, row) => {
              // Mỗi buổi chiếm đúng ô ngày của nó, thụt vào cho thoáng
              const leftPct = (item.dayIndex / cols) * 100
              const widthPct = (1 / cols) * 100

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  role="listitem"
                  title={`${item.title} — ${item.examName}`}
                  className="absolute flex items-center gap-2 rounded-pill px-3 py-2 text-on-tone transition-transform hover:scale-[1.02]"
                  style={{
                    top: row * ROW_H,
                    left: `calc(${leftPct}% + 4px)`,
                    width: `calc(${widthPct * 1.9}% - 8px)`,
                    minWidth: 150,
                    maxWidth: 'calc(100% - 8px)',
                    background: TONE_BG[item.tone],
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] leading-tight font-semibold">
                      {item.title}
                    </span>
                    <span className="block truncate text-[12px] text-on-tone/60">
                      {item.examName}
                    </span>
                  </span>
                  <span className="flex-none rounded-full bg-white/70 px-2 py-0.5 text-[12px] font-bold">
                    {item.percent}%
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="mt-1 flex justify-between border-t border-line pt-2.5">
            {dayLabels.map((label, i) => (
              <span
                key={label}
                className={`flex-1 text-center text-[12.5px] ${
                  i === todayIndex ? 'font-semibold text-ink' : 'text-muted'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
