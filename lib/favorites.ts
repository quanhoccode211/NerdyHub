import 'server-only'
import { prisma } from '@/lib/db'
import { publicPaperFilter } from '@/lib/content-filter'

/**
 * Đề "quan tâm" — ngôi sao ở Kho đề.
 *
 * Danh sách này là NGUỒN VÀO của widget Tiến độ trên Tổng quan: chưa đánh sao
 * đề nào thì widget đổi sang chế độ đề cử, xem `getExamProgress`.
 */

/** Chủ sở hữu theo đúng khuôn của Attempt: đúng một trong hai, không bao giờ cả hai. */
function ownerWhere(userId: string | null, guestId: string | null) {
  return userId ? { userId } : guestId ? { guestId } : null
}

/**
 * Id các đề đang được đánh sao.
 *
 * Lọc qua `publicPaperFilter()` chứ không trả thẳng: một đề có thể bị gỡ khỏi
 * công khai SAU khi ai đó đánh sao (đổi `status`, hoặc `canPublish` về false).
 * Trả về id đó là mọi chỗ đọc danh sách này đều phải tự nhớ lọc lại — mà quên
 * một chỗ là lộ đúng thứ bất biến số 1 sinh ra để chặn.
 */
export async function getFavoritePaperIds(
  userId: string | null,
  guestId: string | null,
): Promise<string[]> {
  const owner = ownerWhere(userId, guestId)
  if (!owner) return []

  const rows = await prisma.favorite.findMany({
    where: { ...owner, paperId: { not: null }, paper: publicPaperFilter() },
    select: { paperId: true },
  })
  return rows.flatMap((r) => (r.paperId ? [r.paperId] : []))
}

/**
 * Id các KỲ THI đang được đánh sao — ngôi sao trên thẻ ở /de-thi.
 *
 * Không lọc qua `publicPaperFilter()` như bên đề: kỳ thi không mang nội dung
 * nào của riêng nó, nó chỉ là cái nhãn gom đề lại. Chỗ cần lọc là lúc đếm đề
 * bên trong — xem `getExamProgress`.
 */
export async function getFavoriteExamIds(
  userId: string | null,
  guestId: string | null,
): Promise<string[]> {
  const owner = ownerWhere(userId, guestId)
  if (!owner) return []

  const rows = await prisma.favorite.findMany({
    where: { ...owner, examId: { not: null }, exam: { isActive: true } },
    select: { examId: true },
  })
  return rows.flatMap((r) => (r.examId ? [r.examId] : []))
}

/**
 * Bật/tắt sao cho một đề. Trả về trạng thái SAU khi đổi.
 *
 * Không nhận `next` từ client mà tự suy từ trạng thái đang có: hai tab cùng mở
 * một trang thì cái nào cũng nghĩ mình đang biết trạng thái đúng, gửi lên
 * `next: true` trong khi hàng đã tồn tại là một lần ghi thừa và một lần trả về
 * sai cho tab kia.
 */
export async function toggleFavorite(
  userId: string | null,
  guestId: string | null,
  target: { paperId: string; examId?: never } | { examId: string; paperId?: never },
): Promise<{ favorited: boolean }> {
  const owner = ownerWhere(userId, guestId)
  if (!owner) return { favorited: false }

  /*
    Khai CẢ HAI cột, một cái null. `where: { ...target }` để trống cột còn lại
    thì Prisma dịch thành "bỏ qua điều kiện đó" chứ không phải "cột đó null" —
    tra sao của một đề sẽ khớp luôn hàng sao của kỳ thi cùng chủ, và cú bấm đầu
    tiên trên đề lại đi xoá mất sao của cả kỳ thi.
  */
  const key = {
    paperId: 'paperId' in target ? (target.paperId ?? null) : null,
    examId: 'examId' in target ? (target.examId ?? null) : null,
  }

  const existing = await prisma.favorite.findFirst({
    where: { ...owner, ...key },
    select: { id: true },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return { favorited: false }
  }

  /*
    `userId` và `guestId` khai TƯỜNG MINH cả hai, một cái là null — không dùng
    `...owner`. Bỏ trống cột còn lại thì Prisma để undefined và hàng ra đời với
    cả hai đều null, tức một bản ghi không có chủ: không ai đọc lại được, mà
    unique cũng không chặn nên bấm bao nhiêu lần sinh bấy nhiêu hàng rác.
  */
  await prisma.favorite.create({
    data: { userId: userId ?? null, guestId: userId ? null : guestId, ...key },
  })
  return { favorited: true }
}
