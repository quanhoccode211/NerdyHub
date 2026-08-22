import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { assertPublishable, publicQuestionFilter } from '@/lib/content-filter'
import { createAttemptSchema } from '@/lib/api-schemas'
import { ensureGuestId, getIdentity } from '@/lib/session'
import { LIMITS, rateLimit } from '@/lib/rate-limit'

/** POST /api/attempts — tạo lượt làm mới { paperId, mode } */
export async function POST(request: NextRequest) {
  /*
    Vẫn phải mint cookie khách kể cả khi đã đăng nhập: người dùng có thể đăng
    xuất giữa chừng, và nhiều đường đọc khác vẫn tra theo guestId.
  */
  const guestId = await ensureGuestId()
  const { userId } = await getIdentity()

  /*
    CHỦ SỞ HỮU của lượt thi — đúng một trong hai, không bao giờ cả hai.
    Trước đây route này không hề gọi auth(), nên mọi lượt thi kể cả của người đã
    đăng nhập đều ra đời với userId = null. Chúng biến mất khỏi "Bài đã làm" và
    toàn bộ /thong-ke, vì hai chỗ đó tra theo userId khi có phiên đăng nhập; xoá
    cookie là mất vĩnh viễn dù người dùng có tài khoản.
  */
  const owner = userId ? { userId, guestId: null } : { userId: null, guestId }

  const limit = rateLimit(`create:${userId ?? guestId}`, LIMITS.createAttempt)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Bạn thao tác quá nhanh, thử lại sau ít giây.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = createAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const paper = await prisma.testPaper.findUnique({
    where: { id: parsed.data.paperId },
    include: { provenance: { select: { canPublish: true } } },
  })

  // Chốt chặn: không cho mở phòng thi với đề không được phép public,
  // kể cả khi gọi API trực tiếp (acceptance criteria F8)
  if (!paper || !assertPublishable(paper)) {
    return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })
  }

  /*
    Đề không có câu nào thì đừng mở phòng thi.

    Đếm SAU bộ lọc nội dung: một đề có thể đủ câu trên giấy nhưng mọi câu đều mang
    provenance không được publish, và phòng thi sẽ nạp ra đúng con số không. Trước
    đây route tạo lượt thi vô tư, rồi phòng thi hiện một dòng "Đề thi này chưa có
    nội dung." không kèm link nào — mà nhóm route phòng thi thì cố ý không có nav.
    Ngõ cụt hoàn toàn.
  */
  const questionCount = await prisma.question.count({
    where: { section: { paperId: paper.id }, ...publicQuestionFilter() },
  })
  if (questionCount === 0) {
    return NextResponse.json(
      { error: 'Đề thi này chưa có nội dung để làm bài.' },
      { status: 422 },
    )
  }

  /*
    Khôi phục thay vì tạo trùng: đã có lượt đang làm dở cho đề này thì vào lại.

    Khớp theo CHỦ SỞ HỮU chứ không phải guestId cứng — người đã đăng nhập đổi máy
    (cookie khách mới) trước đây không bao giờ làm tiếp được bài dở của mình.

    Khớp thêm `mode`: hai chế độ là hai trải nghiệm khác hẳn nhau. Bỏ qua nó thì
    đang dở một lượt thi thật mà bấm "Luyện tập" sẽ bị ném ngược vào phòng bấm
    giờ, và ngược lại.
  */
  const existing = await prisma.attempt.findFirst({
    where: { paperId: paper.id, ...owner, mode: parsed.data.mode, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
  })
  if (existing && existing.expiresAt > new Date()) {
    return NextResponse.json({ attemptId: existing.id, resumed: true })
  }

  /*
    expiresAt tính ở SERVER — đổi giờ máy client không kéo dài được thời gian (F2.2).

    Đúng bằng thời lượng đề, KHÔNG cộng đệm. Bản cũ cộng 30 giây vào đây nên đề 60
    phút mở ra là đồng hồ chạy từ 60:30 — khoảng đệm đáng ra thuộc về phía server
    lại thành phần hiển thị cho thí sinh. Dung sai giờ nằm ở `GRACE_SEC`, chỗ cưỡng
    chế hết giờ, là nơi nó vốn thuộc về.
  */
  const expiresAt = new Date(Date.now() + paper.totalDuration * 1000)

  const attempt = await prisma.attempt.create({
    data: {
      paperId: paper.id,
      ...owner,
      mode: parsed.data.mode,
      status: 'IN_PROGRESS',
      expiresAt,
    },
  })

  return NextResponse.json({ attemptId: attempt.id, resumed: false }, { status: 201 })
}
