/** Định dạng hiển thị, dùng chung. Toàn bộ theo locale vi-VN. */

/** 2100 -> "35 phút", 3900 -> "1 giờ 5 phút" */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Không giới hạn'
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h} giờ`
  return `${h} giờ ${m} phút`
}

/** 125 -> "02:05", 3725 -> "1:02:05" — dùng cho đồng hồ phòng thi */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n)
}

/** Bỏ số 0 thừa: 7.50 -> "7,5"; 8.00 -> "8" */
export function formatScore(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(n)
}

/** Bảng màu pastel cho thẻ kỳ thi — xoay vòng theo thứ tự, giống thiết kế gốc. */
const CARD_TONES = [
  { bg: 'bg-mint', ring: '#16161C' },
  { bg: 'bg-rose', ring: '#16161C' },
  { bg: 'bg-cream', ring: '#16161C' },
  { bg: 'bg-blush', ring: '#16161C' },
  { bg: 'bg-lime', ring: '#16161C' },
] as const

export function cardTone(index: number) {
  return CARD_TONES[index % CARD_TONES.length]
}
