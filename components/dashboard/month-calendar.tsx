'use client'

import { useMemo, useState } from 'react'
import { CardHeader } from '../shell/app-shell'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, DotsIcon } from '../shell/icons'
import { vietnamHolidays } from '@/lib/holidays'

/**
 * Lịch tháng — khối Calendar của ảnh tham chiếu.
 *
 * Ba lớp đánh dấu, ưu tiên từ trên xuống: hôm nay (khối đen đặc) > ngày lễ
 * (nền đỏ nhạt) > ngày có luyện đề (nền mint).
 *
 * Ngày lễ để TRÊN ngày luyện đề vì hai thứ trả lời hai câu khác nhau: "hôm đó
 * mình có học không" thì người dùng tự nhớ được, còn "hôm đó có được nghỉ
 * không" thì phải tra. Ngày vừa là lễ vừa có luyện đề thì `title` nói cả hai.
 *
 * Ô ngày cố ý KHÔNG dùng `aspect-square`: ô vuông theo bề rộng cột làm cả khối
 * cao gần 300px và nống hẳn hàng lưới ba cột ở Tổng quan. Chiều cao cố định
 * `h-9` giữ lịch đọc được mà thấp hơn hẳn.
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

  /*
    Tính theo NĂM của ô lịch đang xem, không phải năm hiện tại: bấm sang tháng 1
    năm sau mà vẫn tra bảng của năm nay là Tết biến mất khỏi đúng cái tháng
    người dùng đang tìm nó.
  */
  const holidays = useMemo(() => vietnamHolidays(cursor.getFullYear()), [cursor])

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
            {/*
              Cập nhật theo HÀM, không đọc `cursor` từ closure: React gộp các
              lần setState trong cùng một nhịp, nên bấm nhanh nhiều lần thì mọi
              lần đều tính từ cùng một `cursor` cũ và lịch chỉ nhảy đúng một
              tháng. Đo được khi bấm 6 lần liên tiếp: chỉ lùi 1 tháng.
            */}
            <button
              type="button"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="icon-circle"
              aria-label="Tháng trước"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
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

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-0.5 text-center text-[12px] font-medium text-muted">
            {w}
          </div>
        ))}

        {cells.map((c) => {
          if (c.day === null) {
            return <div key={c.key} className="h-9 rounded-lg bg-soft/40" />
          }
          const isToday = c.iso === todayIso
          const hasActivity = c.iso !== null && active.has(c.iso)
          const holiday = c.iso !== null ? holidays[c.iso] : undefined

          /* Gộp cả hai thông tin vào một tooltip, thay vì để cái này che cái kia */
          const title = [holiday, hasActivity ? 'Có luyện đề' : null].filter(Boolean).join(' · ')

          return (
            <div
              key={c.key}
              aria-current={isToday ? 'date' : undefined}
              title={title || undefined}
              className={`flex h-9 items-center justify-center rounded-lg text-[13.5px] font-medium transition-colors ${
                isToday
                  ? 'bg-accent font-bold text-[var(--color-accent-fg)]'
                  : holiday
                    ? 'bg-bad-soft font-semibold text-bad'
                    : hasActivity
                      ? 'bg-mint text-on-tone'
                      : 'text-muted-strong hover:bg-soft'
              }`}
            >
              {c.day}
            </div>
          )
        })}
      </div>

      {/*
        Tên ngày lễ TRONG THÁNG ĐANG XEM, liệt kê thẳng ra chứ không bắt rê chuột:
        `title` không dùng được trên thiết bị cảm ứng, mà một ô đỏ không tên thì
        chỉ nói "hôm đó có gì đó" chứ không nói là gì.

        Cắt còn 2 dòng: tháng Tết có tới 5 ngày lễ liền nhau, in hết là khối lịch
        cao thêm gần 60px — đúng cái vừa nén đi.
      */}
      {(() => {
        const inMonth = Object.entries(holidays)
          .filter(([d]) => d.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`))
          .sort()
        if (inMonth.length === 0) return null
        return (
          <ul className="mt-3 border-t border-line pt-2.5 text-[12.5px] text-muted-strong">
            {inMonth.slice(0, 2).map(([d, name]) => (
              <li key={d} className="flex gap-2 truncate">
                <span className="flex-none font-semibold text-bad">{Number(d.slice(8))}</span>
                <span className="truncate">{name}</span>
              </li>
            ))}
            {inMonth.length > 2 && (
              <li className="text-muted">và {inMonth.length - 2} ngày lễ nữa</li>
            )}
          </ul>
        )
      })()}

      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-line pt-2.5 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-accent" /> Hôm nay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-bad-soft" /> Ngày lễ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-mint" /> Có luyện đề
        </span>
      </div>
    </section>
  )
}
