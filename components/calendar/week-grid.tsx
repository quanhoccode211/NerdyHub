import type { GridDay } from '@/lib/calendar/google'

/**
 * Lưới tuần kiểu Google Calendar: cột là ngày, trục dọc là giờ.
 *
 * Vì sao là lưới chứ không phải danh sách: người dùng cần thấy khoảng trống NẰM Ở
 * ĐÂU trong ngày và dài bao nhiêu so với phần còn lại. Một danh sách "07:00–22:00 ·
 * 15 giờ" đọc thì đúng nhưng không trả lời được câu hỏi thật: sáng hay chiều, có
 * dính vào giờ học không, có đủ dài để làm trọn một đề không.
 *
 * Mọi con số vị trí đã được tính sẵn ở server (`buildWeekGrid`) dưới dạng phút tính
 * từ đầu khung giờ. Component này chỉ quy ra phần trăm — không đụng tới `Date`, nên
 * không có cửa cho lệch múi giờ giữa server và trình duyệt.
 */

/** Hai màu do người dùng chỉ định. Không phải token của hệ màu chung nên viết thẳng. */
const COLORS = {
  free: '#93C572',
  busy: '#FF746C',
} as const

export function WeekGrid({
  days,
  dayStartHour,
  dayEndHour,
}: {
  days: GridDay[]
  dayStartHour: number
  dayEndHour: number
}) {
  const spanMin = (dayEndHour - dayStartHour) * 60
  const hours = Array.from({ length: dayEndHour - dayStartHour + 1 }, (_, i) => dayStartHour + i)
  const pct = (min: number) => (min / spanMin) * 100

  return (
    // Lưới hẹp hơn ~700px thì các cột bóp đến mức không đọc nổi — cho cuộn ngang
    // thay vì ép chữ xuống dòng thành từng ký tự.
    <div className="thin-scroll -mx-1 overflow-x-auto px-1">
      <div className="min-w-[680px]">
        {/* Hàng tiêu đề ngày. Thụt trái đúng bằng cột giờ để thẳng cột với lưới. */}
        <div className="flex border-b border-line pb-2">
          <div className="w-12 flex-none" aria-hidden="true" />
          {days.map((d) => (
            <div key={d.key} className="min-w-0 flex-1 px-1 text-center">
              <div className="text-[12px] tracking-wide text-muted uppercase">{d.weekday}</div>
              {/* "Hôm nay" đánh dấu bằng ĐỘ ĐẬM và màu chữ, không dùng viên tròn —
                  cả hàng giữ nguyên nhịp, mắt vẫn bắt được ngay cột hôm nay. */}
              <div
                className={`mt-1 text-[14px] tabular-nums ${
                  d.isToday ? 'font-bold text-ink' : 'font-medium text-muted-strong'
                }`}
              >
                {d.dayLabel}
              </div>
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Cột giờ */}
          <div className="relative w-12 flex-none" style={{ height: `${(dayEndHour - dayStartHour) * 44}px` }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[11.5px] text-muted tabular-nums"
                style={{ top: `${pct((h - dayStartHour) * 60)}%` }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d.key}
              className="relative min-w-0 flex-1 border-l border-line"
              style={{ height: `${(dayEndHour - dayStartHour) * 44}px` }}
            >
              {/* Vạch giờ nền */}
              {hours.slice(0, -1).map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-line/60"
                  style={{ top: `${pct((h - dayStartHour) * 60)}%` }}
                  aria-hidden="true"
                />
              ))}

              {d.blocks.map((b) => (
                <div
                  key={`${b.kind}-${b.startMin}`}
                  /*
                    `inset-x-[3px]` chừa rãnh hai bên để hai cột ngày không dính
                    nhau; `overflow-hidden` để khối ngắn không tràn chữ ra ngoài.
                  */
                  className="absolute inset-x-[3px] overflow-hidden rounded-md px-1.5 py-0.5"
                  style={{
                    top: `${pct(b.startMin)}%`,
                    height: `${pct(b.endMin - b.startMin)}%`,
                    background: COLORS[b.kind],
                    // Cả hai màu đều sáng ở mọi giao diện -> chữ phải luôn tối
                    color: 'var(--color-on-tone)',
                  }}
                  title={`${b.kind === 'free' ? 'Rảnh' : 'Bận'} ${b.label}`}
                >
                  <span className="block text-[11px] leading-tight font-semibold tabular-nums">
                    {b.label}
                  </span>
                  {/* Khối ngắn không đủ chỗ cho dòng thứ hai — 50 phút ≈ 36px */}
                  {b.minutes >= 50 && (
                    <span className="block text-[10.5px] leading-tight opacity-70">
                      {b.kind === 'free' ? 'Rảnh' : 'Bận'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Chú giải màu. Tách riêng để trang gọi đặt ở đâu tuỳ ý. */
export function WeekGridLegend({ bufferMinutes }: { bufferMinutes: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded" style={{ background: COLORS.free }} />
        <span>Rảnh</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded" style={{ background: COLORS.busy }} />
        <span>Bận</span>
      </span>
      <span>Chừa {bufferMinutes} phút trước và sau mỗi khoảng bận.</span>
    </div>
  )
}
