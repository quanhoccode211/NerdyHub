/**
 * Biểu đồ dựng bằng SVG thuần.
 *
 * Không dùng Recharts như SPEC gợi ý: các biểu đồ ở đây đều tĩnh, và thiết kế
 * tham chiếu có phong cách rất riêng (cột mảnh bo tròn, donut dày, vòng tiến độ
 * có đĩa mờ) — ép Recharts theo phong cách đó tốn công hơn là vẽ thẳng, mà lại
 * gánh thêm ~100KB JS vào bundle cho thứ không cần tương tác.
 */

/**
 * Màu phân loại theo kỹ năng. Đọc từ CSS variable — xem globals.css.
 */
const SKILL_TONES = [
  'var(--skill-1)',
  'var(--skill-2)',
  'var(--skill-3)',
  'var(--skill-4)',
  'var(--skill-5)',
] as const

/** Cột dọc — dùng cho phổ điểm và tiến bộ theo thời gian. */
export function BarChart({
  data,
  height = 160,
  highlightIndex,
  valueFormatter,
}: {
  data: { label: string; value: number }[]
  height?: number
  /** Cột được tô đậm — ví dụ khoảng điểm của chính người dùng */
  highlightIndex?: number
  valueFormatter?: (v: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div>
      <div className="flex items-end justify-between gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          const isHighlight = highlightIndex === i
          return (
            <div key={`${d.label}-${i}`} className="group relative flex flex-1 justify-center">
              <div
                className={`w-full max-w-[26px] rounded-t-md transition-opacity hover:opacity-80 ${
                  isHighlight ? 'bg-pink' : 'bg-bar-light'
                }`}
                style={{ height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%` }}
              />
              {/* Tooltip thuần CSS — không cần JS cho biểu đồ tĩnh */}
              <span className="pointer-events-none absolute -top-7 hidden rounded-lg bg-ink px-2 py-1 text-[12px] whitespace-nowrap text-[var(--color-accent-fg)] group-hover:block">
                {valueFormatter ? valueFormatter(d.value) : d.value}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2.5 flex justify-between gap-1.5">
        {data.map((d, i) => (
          <span
            key={`${d.label}-label-${i}`}
            className="flex-1 text-center text-[12px] whitespace-nowrap text-muted"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Donut — phân bố trạng thái. */
export function DonutChart({
  segments,
  size = 168,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--chart-grid)" strokeWidth="10" />
      </svg>
    )
  }

  // Offset tích luỹ tính thuần từ các phần đứng trước (bắt đầu từ 12 giờ),
  // không cộng dồn qua biến ngoài — render phải thuần.
  const arcs = segments.map((seg, i) => {
    const pct = (seg.value / total) * 100
    const preceding = segments
      .slice(0, i)
      .reduce((sum, s) => sum + (s.value / total) * 100, 0)
    return { ...seg, pct, offset: 25 - preceding }
  })

  return (
    <svg width={size} height={size} viewBox="0 0 42 42" role="img" aria-label="Biểu đồ phân bố">
      {arcs.map((arc) => (
        <circle
          key={arc.label}
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke={arc.color}
          strokeWidth="10"
          strokeDasharray={`${arc.pct} ${100 - arc.pct}`}
          strokeDashoffset={arc.offset}
        />
      ))}
    </svg>
  )
}

/** Radar — năng lực theo kỹ năng (SPEC F4.3). */
export function RadarChart({
  axes,
  size = 260,
  maxValue = 100,
}: {
  axes: { label: string; value: number }[]
  size?: number
  maxValue?: number
}) {
  if (axes.length < 3) return null

  const center = size / 2
  const radius = center - 42
  const angleFor = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2

  const pointAt = (i: number, ratio: number) => {
    const a = angleFor(i)
    return [center + Math.cos(a) * radius * ratio, center + Math.sin(a) * radius * ratio] as const
  }

  const rings = [0.25, 0.5, 0.75, 1]
  const polygon = axes
    .map((ax, i) => pointAt(i, Math.max(0.02, Math.min(1, ax.value / maxValue))).join(','))
    .join(' ')

  return (
    <svg width={size} height={size} role="img" aria-label="Biểu đồ năng lực theo kỹ năng">
      {rings.map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => pointAt(i, r).join(',')).join(' ')}
          fill="none"
          stroke="var(--chart-grid)"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pointAt(i, 1)
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />
      })}

      <polygon points={polygon} fill="var(--chart-accent-fill)" stroke="var(--chart-accent)" strokeWidth="2.2" />

      {axes.map((ax, i) => {
        const [x, y] = pointAt(i, Math.max(0.02, Math.min(1, ax.value / maxValue)))
        return <circle key={`dot-${i}`} cx={x} cy={y} r="3.5" fill="var(--chart-accent)" />
      })}

      {axes.map((ax, i) => {
        const [x, y] = pointAt(i, 1.22)
        return (
          <text
            key={`label-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11.5"
            fontWeight="500"
            fill="var(--chart-label)"
          >
            {ax.label}
          </text>
        )
      })}
    </svg>
  )
}

/** Thanh ngang — bảng điểm yếu theo tag. */
export function HorizontalBars({
  rows,
  maxValue = 100,
}: {
  rows: { label: string; value: number; caption?: string }[]
  maxValue?: number
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-[14.5px]">
            <span className="truncate font-medium">{r.label}</span>
            <span className="flex-none text-muted">{r.caption ?? `${Math.round(r.value)}%`}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-soft">
            <div
              className="h-full rounded-pill"
              style={{
                width: `${Math.min(100, (r.value / maxValue) * 100)}%`,
                background: SKILL_TONES[i % SKILL_TONES.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export { SKILL_TONES }
