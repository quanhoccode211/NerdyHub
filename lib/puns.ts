/**
 * Câu chơi chữ hiển thị to ở trang chủ — "daily pun".
 *
 * Thay slogan bằng một câu đùa, đổi theo NGÀY. Cách chọn là index theo số thứ
 * tự ngày trong năm chứ không random: cùng một ngày thì mọi người thấy cùng một
 * câu, và bản render ISR trong ngày không bị lệch với bản mới.
 *
 * Thêm câu mới chỉ cần nối vào mảng này, không phải sửa gì ở trang chủ.
 */

export type Pun = {
  /** Dòng trên — phần dẫn */
  setup: string
  /** Dòng dưới — phần chốt */
  punchline: string
}

export const PUNS: Pun[] = [
  { setup: 'Why did the plant go to therapy?', punchline: 'It had deep-rooted issues.' },
]

/** Số thứ tự ngày trong năm, tính theo giờ địa phương của server. */
function dayOfYear(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

export function punOfTheDay(now: Date = new Date()): Pun {
  return PUNS[dayOfYear(now) % PUNS.length]
}
