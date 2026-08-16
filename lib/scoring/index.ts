import { prisma } from '../db'
import { GRACE_SEC } from '../exam-clock'
import { publicQuestionFilter } from '../content-filter'
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
 *
 * @param opts.autoSubmitted true khi SERVER tự đóng bài lúc hết giờ, không phải
 *   người dùng bấm nộp — trang kết quả cần phân biệt để nói đúng chuyện đã xảy ra.
 */
export async function scoreAttempt(attemptId: string, opts: { autoSubmitted?: boolean } = {}) {
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

  /*
    Nạp toàn bộ câu hỏi kèm đáp án đúng — chỉ ở server.

    `publicQuestionFilter()` phải áp ở ĐÂY, ở `loadExamRoom` và ở `getAttemptResult`
    cùng lúc: câu hỏi mang provenance riêng nên một đề hợp lệ vẫn có thể chứa câu bị
    hạn chế. Áp lệch một chỗ là tử số và mẫu số đếm trên hai tập khác nhau — thí sinh
    không nhìn thấy câu đó nhưng vẫn bị trừ điểm vì nó.
  */
  const questions = await prisma.question.findMany({
    where: { section: { paperId: attempt.paperId }, ...publicQuestionFilter() },
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
  const timeSpent = resolveTimeSpent(attempt)

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
        autoSubmitted: opts.autoSubmitted ?? false,
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

/**
 * Thời gian làm bài thật sự, có trần.
 *
 * Bản cũ lấy thẳng khoảng cách từ `startedAt` tới lúc chấm, tức là đo cả thời gian
 * TREO MÁY: đóng tab, hôm sau mở lại thì trang phòng thi tự chấm và ghi ~24 giờ.
 * Con số đó chảy vào "Bạn làm trong X", phép so nhanh/chậm, `avgTimeSpent` của mọi
 * người khác và tổng giờ học ở /thong-ke — một bài bỏ dở làm hỏng số liệu của cả
 * cộng đồng làm cùng đề.
 *
 *   EXAM     — không ai làm được lâu hơn thời lượng đề, chặn trần ở đó (cộng dung
 *              sai của server).
 *   PRACTICE — không có hạn chót nên trần theo đề vô nghĩa; dùng `timeSpent` do
 *              client đếm và heartbeat 60 giây gửi lên, vốn chỉ chạy khi tab còn mở.
 */
function resolveTimeSpent(attempt: {
  mode: string
  startedAt: Date
  timeSpent: number
  paper: { totalDuration: number }
}): number {
  if (attempt.mode === 'PRACTICE') return Math.max(0, attempt.timeSpent)

  const wallClock = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)
  return Math.min(Math.max(0, wallClock), attempt.paper.totalDuration + GRACE_SEC)
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
 * TRẢ KÈM `cohortSize`, và đó là điểm mấu chốt: một mình con số phần trăm KHÔNG
 * diễn đạt nổi sự khác nhau giữa "người đầu tiên làm đề này" và "điểm thấp hơn tất
 * cả mọi người" — cả hai đều ra 0. Trang kết quả từng chúc mừng đúng người làm tệ
 * nhất vì rẽ nhánh theo `percentile > 0`. Nơi gọi phải rẽ nhánh theo `cohortSize`.
 *
 * Chỉ tính attempt đã nộp — lượt đang làm dở chưa có `scaledScore`.
 *
 * Chú thích cũ ở đây ghi là "loại ABANDONED/EXPIRED", nhưng không chỗ nào trong
 * codebase đặt hai trạng thái đó: bài hết giờ được chấm và trở thành SUBMITTED
 * (phân biệt bằng cờ `autoSubmitted`). Hai giá trị enum ấy giữ lại cho F8.
 */
export async function computePercentile(
  paperId: string,
  scaledScore: number,
): Promise<{ percentile: number; cohortSize: number }> {
  const [cohortSize, below] = await Promise.all([
    prisma.attempt.count({ where: { paperId, status: 'SUBMITTED', scaledScore: { not: null } } }),
    prisma.attempt.count({
      where: { paperId, status: 'SUBMITTED', scaledScore: { lt: scaledScore } },
    }),
  ])
  return {
    percentile: cohortSize > 1 ? (below / cohortSize) * 100 : 0,
    cohortSize,
  }
}

/**
 * Ghi percentile vào Attempt — ẢNH CHỤP tại thời điểm nộp.
 *
 * Danh sách "Bài đã làm" và /thong-ke đọc trường này để khỏi phải tính lại N lần
 * cho N dòng. Trang kết quả thì TÍNH LẠI lúc đọc (`getAttemptResult`), vì ở đó con
 * số đóng băng nói dối: người làm sớm giữ mãi thứ hạng của ngày họ nộp, kể cả khi
 * hàng trăm người làm sau đã xếp lại toàn bộ bảng.
 */
async function updatePercentile(attemptId: string, paperId: string, scaledScore: number) {
  const { percentile } = await computePercentile(paperId, scaledScore)
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
