import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

/**
 * Danh tính người dùng hiện tại cho các trang cần đăng nhập.
 *
 * `profileComplete` = đã có ngày sinh. Đăng nhập bằng Google không lấy được
 * ngày sinh nên hồ sơ chưa đủ để xác minh tuổi theo NĐ 13 — phải chặn lại
 * và hỏi thêm trước khi cho dùng tiếp.
 */

/**
 * Hồ sơ đã đủ chưa — hỏi DATABASE khi token nói là chưa.
 *
 * `profileComplete` sống trong JWT nên có thể CŨ hơn sự thật: người dùng vừa
 * điền ngày sinh xong, DB đã đủ nhưng token thì chưa. Trước đây điều đó tạo ra
 * một vòng lặp chuyển hướng vô hạn giữa /dashboard và /hoan-tat-ho-so, vì hai
 * chỗ đọc hai nguồn khác nhau và ra hai kết luận trái ngược.
 *
 * `completeProfileAction` đã gọi `unstable_update` để token khớp lại, nên hàm
 * này là lưới đỡ thứ hai: nếu vì lý do gì đó token không kịp làm mới, ta vẫn
 * hỏi DB — nguồn sự thật duy nhất — thay vì đá người dùng vào vòng lặp.
 *
 * Chỉ tốn thêm một truy vấn ở đúng nhánh token nói "chưa đủ", tức là hiếm.
 */
export async function profileIsComplete(user: {
  id: string
  profileComplete: boolean
}): Promise<boolean> {
  if (user.profileComplete) return true
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { birthDate: true },
  })
  return Boolean(fresh?.birthDate)
}

/**
 * Tài khoản trong token còn tồn tại không.
 *
 * Token sống 30 ngày, tài khoản thì có thể biến mất sớm hơn nhiều: job dọn dẹp
 * xoá cứng sau 48 giờ (`scripts/purge-deleted-users.ts`), hoặc DB dev bị dựng lại.
 * Khi đó `session.user.id` trỏ vào hư không và mọi truy vấn theo nó đều hỏng —
 * nhưng hỏng MUỘN, ở giữa một server action, dưới dạng lỗi Prisma thô ném vào mặt
 * người dùng thay vì một lời mời đăng nhập lại.
 *
 * Callback `jwt` trong auth.ts đã huỷ token ở lần đăng nhập / lần `update` kế
 * tiếp; hàm này chặn khoảng giữa, khi token cũ vẫn đang được dùng.
 */
export async function userStillExists(userId: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true },
  })
  return Boolean(row) && !row?.deletedAt
}

export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect('/dang-nhap')
  if (!(await userStillExists(session.user.id))) redirect('/dang-nhap?phien=het-han')
  if (!(await profileIsComplete(session.user))) redirect('/hoan-tat-ho-so')
  return session.user
}

/** Không bắt buộc đăng nhập — dùng cho trang chạy được cả ở chế độ khách. */
export async function optionalUser() {
  const session = await auth()
  return session?.user ?? null
}
