/**
 * To-do list: kiểu dùng chung và phép tính ngày.
 *
 * KHÔNG có `server-only` ở đây, cố ý: widget ở client cần đúng những phép tính
 * này để hiển thị hạn chót và để dựng danh sách của khách trong localStorage.
 * Phần chạm database nằm ở `app/api/todos/`.
 */

export const MAX_TASKS = 5
export const MAX_LEN = 80

export type Todo = {
  id: string
  text: string
  done: boolean
  /** null = việc trong ngày. Chuỗi ISO để đi qua JSON mà không đổi nghĩa. */
  dueDate: string | null
}

/**
 * Dựng hạn chót từ NGÀY và THÁNG — không hỏi năm, mặc định năm hiện tại.
 *
 * Nếu ngày đó đã qua thì đẩy sang năm sau. Người gõ "15/1" vào tháng Chạp là
 * đang nói tháng Một tới, không phải một hạn chót đã trôi qua mười một tháng
 * trước; giữ đúng năm hiện tại ở đây chỉ sinh ra một mục "quá hạn 300 ngày"
 * ngay lúc vừa tạo.
 *
 * Đóng dấu 12h TRƯA giờ local chứ không phải 00:00. Cột `dueDate` là
 * `TIMESTAMP` nên nó bị quy về UTC lúc lưu: 00:00 giờ Việt Nam là 17:00 UTC
 * ngày HÔM TRƯỚC, và mọi chỗ sau này lỡ đọc theo UTC sẽ lùi hạn đi một ngày.
 * Giữa trưa thì lệch múi giờ nào cũng không đủ để nhảy ngày.
 */
export function dueDateFromDayMonth(day: number, month: number, now = new Date()): Date | null {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const year = now.getFullYear()
  const make = (y: number) => new Date(y, month - 1, day, 12, 0, 0, 0)

  const d = make(year)
  /* `new Date(2026, 1, 31)` tự trôi sang 3/3 chứ không báo lỗi — kiểm tra lại
     tháng để bắt những ngày không tồn tại (31/2, 31/4). */
  if (d.getMonth() !== month - 1) return null

  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  return d < todayNoon ? make(year + 1) : d
}

/** Số ngày còn lại tới hạn. Âm là đã quá hạn, 0 là hôm nay. */
export function daysUntil(dueIso: string, now = new Date()): number {
  const due = new Date(dueIso)
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** "15/1" — hạn chót hiện gọn trong một cái pill, không cần năm. */
export function formatDue(dueIso: string): string {
  const d = new Date(dueIso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
