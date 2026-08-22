import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { syncSchema } from '@/lib/api-schemas'
import { GRACE_SEC, overdueSeconds } from '@/lib/exam-clock'
import { parseStringArray } from '@/lib/json-fields'
import { getIdentity, ownsAttempt } from '@/lib/session'
import { LIMITS, rateLimit } from '@/lib/rate-limit'
import { scoreAttempt } from '@/lib/scoring'

/**
 * POST /api/attempts/[id]/sync
 * Đồng bộ batch { answers[], annotations[], currentSectionId } — lớp 2 của
 * cơ chế chống mất bài (SPEC F2.5). Client gọi với debounce 3 giây.
 *
 * Phải idempotent: client có hàng đợi offline và sẽ gửi lại cùng một batch.
 *
 * ĐÂY CŨNG LÀ NƠI CƯỠNG CHẾ HẾT GIỜ. Trước đây route tính cờ `expired` rồi vẫn
 * thực thi mọi ops, nên `expiresAt` chỉ là lời đề nghị với client tử tế: đồng hồ
 * máy sai, tab bị treo ở debugger, hay gọi thẳng API bằng curl đều ghi được đáp án
 * sau giờ. Không có chốt ở đây thì mọi thứ chế độ EXAM hứa hẹn đều nằm trong tay
 * người đi thi.
 */
export async function POST(request: NextRequest, ctx: RouteContext<'/api/attempts/[id]'>) {
  const { id } = await ctx.params
  const { userId, guestId } = await getIdentity()

  const limit = rateLimit(`sync:${id}`, LIMITS.sync)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      guestId: true,
      status: true,
      expiresAt: true,
      mode: true,
      audioPlayedSectionIdsJson: true,
    },
  })
  if (!attempt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!ownsAttempt(attempt, { userId, guestId })) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (attempt.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'not_in_progress', status: attempt.status }, { status: 409 })
  }

  const body = await request.json().catch(() => null)
  const parsed = syncSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }
  const { answers, annotations, currentSectionId, timeSpent, audioPlayedSectionIds } = parsed.data

  /*
    Ba vùng thời gian, ba cách xử lý khác nhau:

      overdue <= 0            còn giờ, ghi bình thường.
      0 < overdue <= GRACE    batch này là thao tác làm TRƯỚC hạn chót, chỉ tới muộn
                              vì độ trễ mạng. Ghi nốt rồi đóng bài — vứt đi là phạt
                              nhầm người vì đường truyền của họ.
      overdue > GRACE         BỎ batch. Quá xa hạn chót để còn giải thích bằng độ
                              trễ; đây là đồng hồ client sai hoặc ai đó gọi thẳng
                              API. Vẫn đóng bài để nó không nằm mãi ở IN_PROGRESS.
  */
  const overdue = overdueSeconds(attempt)
  const expired = overdue > 0
  const acceptWrites = overdue <= GRACE_SEC

  const ops = []

  for (const a of answers) {
    ops.push(
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
    )
  }

  for (const an of annotations) {
    if (an.deleted) {
      ops.push(prisma.annotation.deleteMany({ where: { id: an.id, attemptId: id } }))
      continue
    }
    ops.push(
      prisma.annotation.upsert({
        where: { id: an.id },
        create: {
          id: an.id, // id do client sinh => gửi lại không tạo bản sao
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
        update: {
          color: an.color ?? null,
          noteContent: an.noteContent ?? null,
        },
      }),
    )
  }

  /*
    HỢP NHẤT, không ghi đè. Một phần đã phát audio thì không có đường quay lại trạng
    thái chưa phát — kể cả khi client gửi lên một tập thiếu (tab khác chưa biết, hoặc
    payload cũ nằm trong hàng đợi offline). Ghi đè ở đây là mở lại đúng cánh cửa vừa
    đóng: chỉ cần một request thiếu là nghe lại được.
  */
  const audioMerge =
    audioPlayedSectionIds && audioPlayedSectionIds.length > 0
      ? [
          ...new Set([
            ...parseStringArray(attempt.audioPlayedSectionIdsJson),
            ...audioPlayedSectionIds,
          ]),
        ]
      : null

  ops.push(
    prisma.attempt.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        ...(currentSectionId !== undefined ? { currentSectionId } : {}),
        ...(timeSpent !== undefined ? { timeSpent } : {}),
        ...(audioMerge ? { audioPlayedSectionIdsJson: JSON.stringify(audioMerge) } : {}),
      },
    }),
  )

  if (acceptWrites) await prisma.$transaction(ops)

  /*
    Hết giờ thì SERVER đóng bài ngay trong request này, không nhờ client nộp hộ.

    `scoreAttempt` idempotent nên hai tab cùng chạm vào đây không chấm hai lần. Sau
    lệnh này attempt hết IN_PROGRESS, nên mọi lần sync tiếp theo dừng ở chốt 409 phía
    trên và `onGone('not_in_progress')` ở client sẽ khoá phòng, dọn bản nháp cục bộ
    rồi chuyển sang trang kết quả.
  */
  if (expired) {
    await scoreAttempt(id, { autoSubmitted: true })
  }

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    expired,
    /** false = batch bị bỏ vì gửi quá muộn. Client không nên coi là đã lưu. */
    accepted: acceptWrites,
    // Đồng hồ luôn lấy từ server — client chỉ hiển thị (F2.2)
    remainingSeconds: Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000)),
  })
}
