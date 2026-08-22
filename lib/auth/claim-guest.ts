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

  /*
    Sao "quan tâm" đi theo bài làm, cùng một lý do: đánh sao vài đề lúc còn là
    khách rồi đăng nhập mà mất sạch thì lần sau không ai đánh nữa.

    KHÔNG gộp bằng `updateMany` như trên được: `@@unique([userId, paperId])` sẽ
    nổ nếu tài khoản đã đánh sao đúng đề đó từ máy khác. Xoá trước những hàng
    khách trùng với hàng đã có của tài khoản, rồi mới chuyển phần còn lại.
  */
  const mine = await prisma.favorite.findMany({
    where: { userId },
    select: { paperId: true, examId: true },
  })
  if (mine.length > 0) {
    const paperIds = mine.flatMap((f) => (f.paperId ? [f.paperId] : []))
    const examIds = mine.flatMap((f) => (f.examId ? [f.examId] : []))
    await prisma.favorite.deleteMany({
      where: {
        guestId,
        userId: null,
        OR: [{ paperId: { in: paperIds } }, { examId: { in: examIds } }],
      },
    })
  }
  const favs = await prisma.favorite.updateMany({
    where: { guestId, userId: null },
    data: { userId, guestId: null },
  })
  if (favs.count > 0) {
    console.log(`[auth] Đã gộp ${favs.count} đề quan tâm của khách vào tài khoản ${userId}`)
  }

  if (count > 0) {
    console.log(`[auth] Đã gộp ${count} lượt làm bài của khách vào tài khoản ${userId}`)
  }
  return count
}
