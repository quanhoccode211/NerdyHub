import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { syncSchema } from '@/lib/api-schemas'
import { getIdentity, ownsAttempt } from '@/lib/session'
import { LIMITS, rateLimit } from '@/lib/rate-limit'
import { scoreAttempt } from '@/lib/scoring'

/**
 * POST /api/attempts/[id]/submit — nộp bài → chấm → trả kết quả.
 * Nhận kèm batch đồng bộ cuối cùng để không mất thao tác vừa thực hiện
 * trước khi bấm nộp.
 */
export async function POST(request: NextRequest, ctx: RouteContext<'/api/attempts/[id]'>) {
  const { id } = await ctx.params
  const { userId, guestId } = await getIdentity()

  const limit = rateLimit(`submit:${id}`, LIMITS.submit)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Bạn nộp bài quá nhanh, thử lại sau ít giây.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    select: { id: true, userId: true, guestId: true, status: true },
  })
  if (!attempt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!ownsAttempt(attempt, { userId, guestId })) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Đã nộp rồi -> trả về luôn, không chấm lại (idempotent)
  if (attempt.status === 'SUBMITTED') {
    return NextResponse.json({ ok: true, attemptId: id, alreadySubmitted: true })
  }

  // Ghi nốt batch cuối nếu client gửi kèm
  const body = await request.json().catch(() => null)
  if (body) {
    const parsed = syncSchema.safeParse(body)
    if (parsed.success) {
      const { answers, annotations, timeSpent } = parsed.data
      const ops = [
        ...answers.map((a) =>
          prisma.attemptAnswer.upsert({
            where: { attemptId_questionId: { attemptId: id, questionId: a.questionId } },
            create: {
              attemptId: id,
              questionId: a.questionId,
              selectedChoiceIdsJson: JSON.stringify(a.selectedChoiceIds ?? []),
              textAnswer: a.textAnswer ?? null,
              isFlagged: a.isFlagged ?? false,
              timeSpent: a.timeSpent ?? 0,
              changedCount: a.changedCount ?? 0,
            },
            // Cùng hợp đồng lưu trữ với /sync: một payload không được mang hai
            // nghĩa tuỳ theo gọi vào endpoint nào.
            update: {
              ...(a.selectedChoiceIds !== undefined
                ? { selectedChoiceIdsJson: JSON.stringify(a.selectedChoiceIds) }
                : {}),
              ...(a.textAnswer !== undefined ? { textAnswer: a.textAnswer } : {}),
              ...(a.isFlagged !== undefined ? { isFlagged: a.isFlagged } : {}),
              ...(a.timeSpent !== undefined ? { timeSpent: a.timeSpent } : {}),
              ...(a.changedCount !== undefined ? { changedCount: a.changedCount } : {}),
            },
          }),
        ),
        ...annotations.map((an) =>
          an.deleted
            ? // Batch cuối cũng phải XOÁ được. Bản cũ lọc phăng nhánh này, nên
              // highlight người dùng vừa xoá trước lúc bấm nộp sẽ sống lại ở
              // trang xem lại. Ràng theo attemptId để không chạm bài của người khác.
              prisma.annotation.deleteMany({ where: { id: an.id, attemptId: id } })
            : prisma.annotation.upsert({
                where: { id: an.id },
                create: {
                  id: an.id,
                  attemptId: id,
                  targetType: an.targetType,
                  targetId: an.targetId,
                  type: an.type,
                  startOffset: an.startOffset ?? null,
                  endOffset: an.endOffset ?? null,
                  selectedText: an.selectedText ?? null,
                  color: an.color ?? null,
                  noteContent: an.noteContent ?? null,
                },
                update: { color: an.color ?? null, noteContent: an.noteContent ?? null },
              }),
        ),
        ...(timeSpent !== undefined
          ? [prisma.attempt.update({ where: { id }, data: { timeSpent } })]
          : []),
      ]

      /*
        Ghi batch cuối KHÔNG được phép chặn việc chấm bài.

        `Annotation.id` là unique toàn cục và `where` của upsert không ràng theo
        attemptId, nên một id trùng từ lượt thi khác sẽ ném lỗi và kéo sập cả
        request — bài làm hoàn toàn hợp lệ mà không bao giờ được chấm. Sau đợt
        này chuyện đó còn nguy hiểm hơn: tự nộp khi hết giờ sẽ thử lại mãi trước
        một request hỏng tất định.

        Đáp án đã được autosave lo từ trước; mất batch cuối là thiệt hại nhỏ hơn
        nhiều so với không chấm được bài.
      */
      if (ops.length > 0) {
        try {
          await prisma.$transaction(ops)
        } catch (err) {
          console.error(`[submit] Batch cuối của lượt ${id} ghi lỗi, vẫn chấm tiếp:`, err)
        }
      }
    }
  }

  const result = await scoreAttempt(id)

  return NextResponse.json({
    ok: true,
    attemptId: id,
    alreadySubmitted: result.alreadySubmitted,
    scaledScore: result.scaledScore,
  })
}
