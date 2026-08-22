import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { publicPaperFilter } from '@/lib/content-filter'
import { toggleFavoriteSchema } from '@/lib/api-schemas'
import { getFavoriteExamIds, getFavoritePaperIds, toggleFavorite } from '@/lib/favorites'
import { ensureGuestId, getIdentity, readGuestId } from '@/lib/session'
import { LIMITS, rateLimit } from '@/lib/rate-limit'

/**
 * Ngôi sao "quan tâm" ở Kho đề.
 *
 * Có route riêng chứ không phải Server Action vì `/de-thi/**` là SSG/ISR: trang
 * dựng sẵn lúc build, không biết ai đang xem. Ngôi sao vì vậy phải tự đi hỏi
 * sau khi hydrate — đúng cách khung giao diện đang đổi ngôn ngữ ở client.
 */

/** GET /api/favorites — id các đề người dùng hiện tại đã đánh sao */
export async function GET() {
  /*
    ĐÚC COOKIE KHÁCH NGAY Ở ĐƯỜNG ĐỌC, dù ở đây chẳng cần danh tính để trả về
    một mảng rỗng. Đây là chỗ chữa một lỗi MẤT DỮ LIỆU, không phải tiện tay:

    Ngôi sao gọi GET này đúng một lần lúc trang mở, rồi mỗi cú bấm là một POST.
    Nếu chỉ POST mới đúc cookie thì hai cú bấm gần nhau chạy song song, cả hai
    cùng thấy "chưa có cookie" và mỗi cái đẻ MỘT uuid khác nhau — cái sau ghi
    đè cookie của cái trước, và ngôi sao gắn vào danh tính đầu tiên biến mất
    khỏi mọi lần đọc sau đó. Đo được: bấm hai sao, server lưu một.

    Đúc ở GET thì tới lúc bấm được cái sao đầu tiên cookie đã nằm sẵn, mọi POST
    sau đó dùng chung một danh tính — kể cả POST từ tab khác.

    Cái giá: một khách chỉ ghé xem cũng nhận cookie. Đó chỉ là một cookie, KHÔNG
    sinh hàng nào trong database — `Favorite` chỉ ra đời khi có người bấm.
  */
  const guestId = await ensureGuestId()
  const { userId } = await getIdentity()

  const [paperIds, examIds] = await Promise.all([
    getFavoritePaperIds(userId, guestId),
    getFavoriteExamIds(userId, guestId),
  ])
  return NextResponse.json({ paperIds, examIds })
}

/** POST /api/favorites — bật/tắt sao cho một đề { paperId } */
export async function POST(request: NextRequest) {
  /*
    `readGuestId` là đủ vì GET ở trên đã đúc cookie trước rồi. Vẫn gọi
    `ensureGuestId` khi chưa có — có người gọi thẳng endpoint này mà không qua
    giao diện, và bỏ trống danh tính thì `toggleFavorite` lặng lẽ không ghi gì.
  */
  const guestId = (await readGuestId()) ?? (await ensureGuestId())
  const { userId } = await getIdentity()

  const limit = rateLimit(`favorite:${userId ?? guestId}`, LIMITS.favorite)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Bạn thao tác quá nhanh, thử lại sau ít giây.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = toggleFavoriteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  /*
    LỌC NỘI DUNG ÁP CẢ Ở ĐÂY, không chỉ ở đường đọc.

    Bất biến số 1 nói không lộ nội dung không được phép ra mọi lối ra. Cho đánh
    sao một đề nội bộ là mở đúng một lối: id đó sau đó nằm trong danh sách quan
    tâm, và widget Tiến độ lấy tên kỳ thi cùng số đề từ chính danh sách ấy.
    `getFavoritePaperIds` có lọc lại, nhưng chặn từ lúc ghi thì trong database
    không có sẵn hàng rác để một đường đọc tương lai quên lọc.
  */
  if ('examId' in parsed.data) {
    /* Kỳ thi phải đang bật VÀ có ít nhất một đề công khai — y hệt điều kiện
       /de-thi dùng để liệt kê. Cho đánh sao một kỳ thi không hiện ở đâu cả là
       một dòng trong widget Tiến độ trỏ tới trang trống. */
    const exam = await prisma.exam.findFirst({
      where: { id: parsed.data.examId, isActive: true, papers: { some: publicPaperFilter() } },
      select: { id: true },
    })
    if (!exam) return NextResponse.json({ error: 'Không tìm thấy kỳ thi' }, { status: 404 })

    const result = await toggleFavorite(userId, userId ? null : guestId, { examId: exam.id })
    return NextResponse.json(result)
  }

  const paper = await prisma.testPaper.findFirst({
    where: { AND: [{ id: parsed.data.paperId }, publicPaperFilter()] },
    select: { id: true },
  })
  if (!paper) return NextResponse.json({ error: 'Không tìm thấy đề' }, { status: 404 })

  const result = await toggleFavorite(userId, userId ? null : guestId, { paperId: paper.id })
  return NextResponse.json(result)
}
