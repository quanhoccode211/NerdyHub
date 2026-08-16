import 'server-only'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { GUEST_COOKIE } from '@/lib/session'

/**
 * Chuyển toàn bộ bài làm của phiên khách sang tài khoản vừa đăng nhập.
 *
 * Nguyên tắc bất biến số 5 — không bao giờ để người dùng mất bài làm. Người dùng
 * hay làm vài đề ở chế độ khách rồi mới đăng ký; nếu số bài đó biến mất thì việc
 * đăng ký lại thành hành động trừng phạt.
 *
 * Idempotent: chạy lại không ảnh hưởng gì vì lượt đã gán userId không còn khớp
 * điều kiện `userId: null`.
 */
export async function claimGuestData(userId: string): Promise<number> {
  let guestId: string | null = null
  try {
    const store = await cookies()
    guestId = store.get(GUEST_COOKIE)?.value ?? null
  } catch {
    // Ngoài request context (không nên xảy ra) — bỏ qua, không làm hỏng đăng nhập
    return 0
  }
  if (!guestId) return 0

  /*
    Gán userId VÀ bỏ guestId — một hàng chỉ được có đúng một chủ.

    Giữ lại guestId thì hàng vẫn khớp `where: { guestId }`, mà đó đúng là truy
    vấn các trang danh sách dùng khi chưa đăng nhập (`bai-lam/page.tsx:21`,
    `lib/dashboard.ts`, `lib/results.ts:144`). Người tiếp theo trên cùng máy, cầm
    lại cookie cũ, sẽ thấy nguyên danh sách bài của tài khoản trước — kể cả khi
    `ownsAttempt` đã chặn ở trang chi tiết.
  */
  const { count } = await prisma.attempt.updateMany({
    where: { guestId, userId: null },
    data: { userId, guestId: null },
  })

  if (count > 0) {
    console.log(`[auth] Đã gộp ${count} lượt làm bài của khách vào tài khoản ${userId}`)
  }
  return count
}
