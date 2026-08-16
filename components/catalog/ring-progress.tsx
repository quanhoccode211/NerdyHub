/**
 * Vòng tiến độ — chi tiết đặc trưng của thiết kế gốc: nền trắng mờ lệch tâm
 * phía sau vòng cung, tạo cảm giác "đĩa" nổi trên nền pastel.
 */
export function RingProgress({
  percent,
  size = 104,
  stroke = 7,
  label,
  color = '#16161C',
}: {
  percent: number
  size?: number
  stroke?: number
  label?: string
  color?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const r = (size - stroke * 2) / 2 - 2
  const circumference = 2 * Math.PI * r
  const dash = (clamped / 100) * circumference
  const center = size / 2

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full bg-white/65"
        style={{ width: size * 0.75, height: size * 0.75, left: size * 0.04, top: size * 0.155 }}
      />
      <svg width={size} height={size} className="block -rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  )
}
