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

export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect('/dang-nhap')
  if (!(await profileIsComplete(session.user))) redirect('/hoan-tat-ho-so')
  return session.user
}

/** Không bắt buộc đăng nhập — dùng cho trang chạy được cả ở chế độ khách. */
export async function optionalUser() {
  const session = await auth()
  return session?.user ?? null
}
