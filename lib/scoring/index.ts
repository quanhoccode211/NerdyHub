import { prisma } from '../db'
import { parseStringArray } from '../json-fields'
import type { Skill } from '../enums'
import { getStrategy } from './strategies'
import type { GradableQuestion, SubmittedAnswer } from './types'

export * from './types'
export { getStrategy } from './strategies'
export { normalizeText } from './grader'

/**
 * Chấm một lượt làm bài và ghi kết quả.
 *
 * Idempotent: attempt đã SUBMITTED thì trả kết quả đã có, không chấm lại
 * (SPEC mục 5 rate-limit + tránh double-submit làm sai attemptCount/avgScore).
 */
export async function scoreAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      paper: { include: { exam: true, level: true } },
    },
  })
  if (!attempt) throw new Error('Không tìm thấy lượt làm bài')

  if (attempt.status === 'SUBMITTED') {
    return {
      alreadySubmitted: true as const,
      scaledScore: attempt.scaledScore,
      rawScore: attempt.rawScore,
    }
  }

  // Nạp toàn bộ câu hỏi kèm đáp án đúng — chỉ ở server
  const questions = await prisma.question.findMany({
    where: { section: { paperId: attempt.paperId } },
    include: {
      choices: { select: { id: true, isCorrect: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
      section: { select: { id: true, skill: true } },
    },
  })

  const gradable: GradableQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type as GradableQuestion['type'],
    points: q.points,
    skill: q.section.skill as Skill,
    sectionId: q.section.id,
    correctChoiceIds: q.choices.filter((c) => c.isCorrect).map((c) => c.id),
    correctText: parseStringArray(q.correctTextJson),
  }))

  const submitted: SubmittedAnswer[] = attempt.answers.map((a) => ({
    questionId: a.questionId,
    selectedChoiceIds: parseStringArray(a.selectedChoiceIdsJson),
    textAnswer: a.textAnswer,
  }))

  const strategy = getStrategy(attempt.paper.exam.slug)
  const raw = strategy.scoreRaw(gradable, submitted)

  const conversions = await prisma.scoreConversion.findMany({
    where: { examSlug: attempt.paper.exam.slug },
  })
  const scaled = strategy.scale(raw, {
    examSlug: attempt.paper.exam.slug,
    levelSlug: attempt.paper.level?.slug ?? null,
    conversions,
  })

  const now = new Date()
  const timeSpent = Math.max(
    0,
    Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000),
  )

  // Ghi điểm từng câu + trạng thái attempt trong một transaction
  await prisma.$transaction([
    ...raw.answers.map((g) =>
      prisma.attemptAnswer.updateMany({
        where: { attemptId, questionId: g.questionId },
        data: { isCorrect: g.isCorrect, pointsEarned: g.pointsEarned },
      }),
    ),
    prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
        timeSpent,
        rawScore: raw.percent,
        scaledScore: scaled.scaledScore,
        sectionScoresJson: JSON.stringify(scaled.sectionScores),
      },
    }),
  ])

  await refreshPaperAggregates(attempt.paperId)
  await updatePercentile(attemptId, attempt.paperId, scaled.scaledScore)

  return {
    alreadySubmitted: false as const,
    raw,
    scaled,
    scaledScore: scaled.scaledScore,
    rawScore: raw.percent,
  }
}

/** Cập nhật attemptCount / avgScore denormalized trên TestPaper. */
async function refreshPaperAggregates(paperId: string) {
  const agg = await prisma.attempt.aggregate({
    where: { paperId, status: 'SUBMITTED' },
    _count: { _all: true },
    _avg: { scaledScore: true },
  })
  await prisma.testPaper.update({
    where: { id: paperId },
    data: {
      attemptCount: agg._count._all,
      avgScore: agg._avg.scaledScore,
    },
  })
}

/**
 * Percentile — "Bạn cao hơn N% người đã làm đề này".
 *
 * SPEC đề xuất Redis sorted set. Máy dev không có Redis nên bản này tính từ
 * PostgreSQL/SQLite qua index [paperId, scaledScore]. Chữ ký hàm giữ nguyên
 * để thay bằng ZRANK khi có Redis mà không đụng nơi gọi.
 *
 * Chỉ tính attempt SUBMITTED — loại ABANDONED/EXPIRED (acceptance criteria F4).
 */
async function updatePercentile(attemptId: string, paperId: string, scaledScore: number) {
  const [total, below] = await Promise.all([
    prisma.attempt.count({ where: { paperId, status: 'SUBMITTED', scaledScore: { not: null } } }),
    prisma.attempt.count({
      where: { paperId, status: 'SUBMITTED', scaledScore: { lt: scaledScore } },
    }),
  ])
  const percentile = total > 1 ? (below / total) * 100 : 0
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { percentile },
  })
}

/** Phổ điểm cho biểu đồ histogram trang kết quả. */
export async function getScoreDistribution(paperId: string, buckets = 10, maxScale = 10) {
  const attempts = await prisma.attempt.findMany({
    where: { paperId, status: 'SUBMITTED', scaledScore: { not: null } },
    select: { scaledScore: true },
  })

  const size = maxScale / buckets
  const hist = Array.from({ length: buckets }, (_, i) => ({
    from: Number((i * size).toFixed(2)),
    to: Number(((i + 1) * size).toFixed(2)),
    count: 0,
  }))

  for (const a of attempts) {
    if (a.scaledScore === null) continue
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor(a.scaledScore / size)))
    hist[idx].count++
  }
  return hist
}
