import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { syncSchema } from '@/lib/api-schemas'
import { getIdentity, ownsAttempt } from '@/lib/session'
import { LIMITS, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/attempts/[id]/sync
 * Đồng bộ batch { answers[], annotations[], currentSectionId } — lớp 2 của
 * cơ chế chống mất bài (SPEC F2.5). Client gọi với debounce 3 giây.
 *
 * Phải idempotent: client có hàng đợi offline và sẽ gửi lại cùng một batch.
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
    select: { id: true, userId: true, guestId: true, status: true, expiresAt: true, mode: true },
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
  const { answers, annotations, currentSectionId, timeSpent } = parsed.data

  // Hết giờ: nhận nốt batch cuối rồi báo client nộp bài,
  // không vứt dữ liệu thí sinh vừa làm.
  const expired = attempt.mode === 'EXAM' && attempt.expiresAt.getTime() <= Date.now()

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

  ops.push(
    prisma.attempt.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        ...(currentSectionId !== undefined ? { currentSectionId } : {}),
        ...(timeSpent !== undefined ? { timeSpent } : {}),
      },
    }),
  )

  await prisma.$transaction(ops)

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    expired,
    // Đồng hồ luôn lấy từ server — client chỉ hiển thị (F2.2)
    remainingSeconds: Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000)),
  })
}
