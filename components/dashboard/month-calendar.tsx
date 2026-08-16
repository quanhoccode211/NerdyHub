'use client'

import { useMemo, useState } from 'react'
import { CardHeader } from '../shell/app-shell'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, DotsIcon } from '../shell/icons'

/**
 * Lịch tháng — khối Calendar của ảnh tham chiếu.
 * Ngày có hoạt động luyện đề được tô nền mint; hôm nay là khối đen đặc.
 */

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

export function MonthCalendar({ activeDates }: { activeDates: string[] }) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const active = useMemo(() => new Set(activeDates), [activeDates])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0 = CN
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const out: { key: string; day: number | null; iso: string | null }[] = []
    for (let i = 0; i < firstDay; i++) out.push({ key: `pad-${i}`, day: null, iso: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      out.push({ key: iso, day: d, iso })
    }
    // Bù cho đủ hàng cuối
    while (out.length % 7 !== 0) out.push({ key: `tail-${out.length}`, day: null, iso: null })
    return out
  }, [cursor])

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <section className="card p-5 md:p-6">
      <CardHeader
        icon={<CalendarIcon size={17} />}
        title="Lịch"
        meta={
          <span className="pill bg-soft text-[13px] text-muted-strong">
            {MONTHS[cursor.getMonth()]}
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="icon-circle"
              aria-label="Tháng trước"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="icon-circle"
              aria-label="Tháng sau"
            >
              <ChevronRightIcon size={16} />
            </button>
            <button type="button" className="icon-circle" aria-label="Tuỳ chọn khác">
              <DotsIcon size={16} />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-[12.5px] font-medium text-muted">
            {w}
          </div>
        ))}

        {cells.map((c) => {
          if (c.day === null) {
            return <div key={c.key} className="aspect-square rounded-xl bg-soft/40" />
          }
          const isToday = c.iso === todayIso
          const hasActivity = c.iso !== null && active.has(c.iso)

          return (
            <div
              key={c.key}
              aria-current={isToday ? 'date' : undefined}
              title={hasActivity ? 'Có luyện đề hôm này' : undefined}
              className={`flex aspect-square items-center justify-center rounded-xl text-[14px] font-medium transition-colors ${
                isToday
                  ? 'bg-accent font-bold text-[var(--color-accent-fg)]'
                  : hasActivity
                    ? 'bg-mint text-ink'
                    : 'text-muted-strong hover:bg-soft'
              }`}
            >
              {c.day}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[12.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-accent" /> Hôm nay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-mint" /> Có luyện đề
        </span>
      </div>
    </section>
  )
}
