import 'server-only'
import { prisma } from './db'
import { parseRecord, parseStringArray } from './json-fields'
import { getScoreDistribution, getStrategy } from './scoring'
import { UNGRADED_TYPES, type QuestionType, type Skill } from './enums'

/** Dữ liệu cho trang kết quả (SPEC F4.1). */
export async function getAttemptResult(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      paper: { include: { exam: true, level: true } },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              number: true,
              type: true,
              content: true,
              tagsJson: true,
              difficulty: true,
              section: { select: { id: true, skill: true, title: true } },
            },
          },
        },
      },
    },
  })
  if (!attempt || attempt.status !== 'SUBMITTED') return null

  const strategy = getStrategy(attempt.paper.exam.slug)
  const sectionScores = parseRecord(attempt.sectionScoresJson)

  // Toàn bộ câu của đề. Câu không trả lời KHÔNG có dòng AttemptAnswer nhưng vẫn
  // bị tính 0 điểm, nên thống kê phải dựa trên danh sách này — nếu chỉ đếm trên
  // attempt.answers thì tỉ lệ đúng theo kỹ năng sẽ bị thổi phồng và mâu thuẫn
  // với tổng điểm hiển thị ngay bên cạnh.
  const allQuestions = await prisma.question.findMany({
    where: { section: { paperId: attempt.paperId } },
    select: { id: true, type: true, section: { select: { skill: true } } },
  })
  const totalQuestions = allQuestions.length

  const wrong = attempt.answers.filter((a) => a.isCorrect === false)
  const correct = attempt.answers.filter((a) => a.isCorrect === true)
  const ungraded = attempt.answers.filter((a) => a.isCorrect === null)

  // Gom câu sai theo tag để chỉ ra điểm yếu
  const tagStats = new Map<string, { wrong: number; total: number }>()
  for (const a of attempt.answers) {
    if (a.isCorrect === null) continue
    for (const tag of parseStringArray(a.question.tagsJson)) {
      const s = tagStats.get(tag) ?? { wrong: 0, total: 0 }
      s.total++
      if (a.isCorrect === false) s.wrong++
      tagStats.set(tag, s)
    }
  }

  const weakTags = [...tagStats.entries()]
    .filter(([, s]) => s.total >= 2 && s.wrong > 0)
    .map(([tag, s]) => ({ tag, wrong: s.wrong, total: s.total, rate: (s.wrong / s.total) * 100 }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6)

  // Gom theo kỹ năng trên TOÀN BỘ câu của đề, không chỉ câu đã trả lời.
  // Câu ESSAY/SPEAKING bị loại vì không chấm tự động (mẫu số phải khớp cách tính điểm).
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]))
  const skillStats = new Map<Skill, { wrong: number; total: number }>()
  for (const q of allQuestions) {
    if (UNGRADED_TYPES.includes(q.type as QuestionType)) continue
    const skill = q.section.skill as Skill
    const s = skillStats.get(skill) ?? { wrong: 0, total: 0 }
    s.total++
    // Không trả lời cũng là sai — đúng như cách engine chấm
    if (answerByQuestion.get(q.id)?.isCorrect !== true) s.wrong++
    skillStats.set(skill, s)
  }

  const distribution = await getScoreDistribution(attempt.paperId, 10, strategy.maxScale)

  // Thời gian trung bình của những người khác, để so sánh
  const avgTime = await prisma.attempt.aggregate({
    where: { paperId: attempt.paperId, status: 'SUBMITTED' },
    _avg: { timeSpent: true },
  })

  return {
    attempt: {
      id: attempt.id,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      rawScore: attempt.rawScore ?? 0,
      scaledScore: attempt.scaledScore ?? 0,
      percentile: attempt.percentile ?? 0,
      mode: attempt.mode,
    },
    paper: {
      id: attempt.paper.id,
      title: attempt.paper.title,
      examSlug: attempt.paper.exam.slug,
      examName: attempt.paper.exam.name,
      paperSlug: attempt.paper.slug,
      levelName: attempt.paper.level?.name ?? null,
      totalDuration: attempt.paper.totalDuration,
    },
    maxScale: strategy.maxScale,
    sectionScores,
    counts: {
      total: totalQuestions,
      correct: correct.length,
      wrong: wrong.length,
      unanswered: totalQuestions - attempt.answers.length,
      ungraded: ungraded.length,
    },
    wrongQuestions: wrong
      .map((a) => ({
        id: a.question.id,
        number: a.question.number,
        content: a.question.content,
        skill: a.question.section.skill as Skill,
        sectionTitle: a.question.section.title,
        tags: parseStringArray(a.question.tagsJson),
        difficulty: a.question.difficulty,
      }))
      .sort((x, y) => x.number - y.number),
    weakTags,
    skillStats: [...skillStats.entries()].map(([skill, s]) => ({
      skill,
      wrong: s.wrong,
      total: s.total,
      correctRate: ((s.total - s.wrong) / s.total) * 100,
    })),
    distribution,
    avgTimeSpent: Math.round(avgTime._avg.timeSpent ?? 0),
  }
}

/** Thống kê tổng của một người dùng/khách (SPEC F4.3). */
export async function getOverallStats(guestId: string | null, userId: string | null) {
  if (!guestId && !userId) return null

  const where = userId ? { userId } : { guestId }
  const attempts = await prisma.attempt.findMany({
    where: { ...where, status: 'SUBMITTED' },
    orderBy: { submittedAt: 'asc' },
    include: {
      paper: { include: { exam: true } },
      answers: {
        include: {
          question: {
            select: { tagsJson: true, section: { select: { skill: true } } },
          },
        },
      },
    },
  })

  if (attempts.length === 0) {
    return { attempts: [], totalTime: 0, streak: 0, skillAverages: [], weakTags: [], progress: [] }
  }

  const totalTime = attempts.reduce((s, a) => s + a.timeSpent, 0)

  // Chuỗi ngày học liên tiếp tính tới hôm nay
  const days = new Set(
    attempts
      .map((a) => a.submittedAt?.toISOString().slice(0, 10))
      .filter((d): d is string => Boolean(d)),
  )
  let streak = 0
  const cursor = new Date()
  for (;;) {
    const key = cursor.toISOString().slice(0, 10)
    if (days.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    // Hôm nay chưa làm thì chuỗi vẫn còn nếu hôm qua có
    if (streak === 0 && key === new Date().toISOString().slice(0, 10)) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    break
  }

  // Toàn bộ câu của các đề đã làm. Phải dựa trên đây chứ không phải trên
  // attempt.answers: câu bỏ trống không sinh dòng answer nhưng vẫn bị chấm 0,
  // nếu bỏ qua chúng thì tỉ lệ ở trang này sẽ vênh với trang kết quả.
  const paperIds = [...new Set(attempts.map((a) => a.paperId))]
  const questionsByPaper = await prisma.question.findMany({
    where: { section: { paperId: { in: paperIds } } },
    select: { id: true, type: true, section: { select: { paperId: true, skill: true } } },
  })
  const byPaper = new Map<string, typeof questionsByPaper>()
  for (const q of questionsByPaper) {
    const list = byPaper.get(q.section.paperId) ?? []
    list.push(q)
    byPaper.set(q.section.paperId, list)
  }

  const skillAcc = new Map<Skill, { correct: number; total: number }>()
  const tagAcc = new Map<string, { wrong: number; total: number }>()

  for (const a of attempts) {
    const answerByQuestion = new Map(a.answers.map((ans) => [ans.questionId, ans]))

    for (const q of byPaper.get(a.paperId) ?? []) {
      if (UNGRADED_TYPES.includes(q.type as QuestionType)) continue
      const skill = q.section.skill as Skill
      const s = skillAcc.get(skill) ?? { correct: 0, total: 0 }
      s.total++
      if (answerByQuestion.get(q.id)?.isCorrect === true) s.correct++
      skillAcc.set(skill, s)
    }

    // Điểm yếu theo tag chỉ tính trên câu đã trả lời: bỏ trống vì hết giờ là
    // vấn đề tốc độ, không phải lỗ hổng kiến thức ở dạng câu đó.
    for (const ans of a.answers) {
      if (ans.isCorrect === null) continue
      for (const tag of parseStringArray(ans.question.tagsJson)) {
        const t = tagAcc.get(tag) ?? { wrong: 0, total: 0 }
        t.total++
        if (!ans.isCorrect) t.wrong++
        tagAcc.set(tag, t)
      }
    }
  }

  return {
    attempts: attempts.map((a) => ({
      id: a.id,
      paperTitle: a.paper.title,
      examName: a.paper.exam.name,
      examSlug: a.paper.exam.slug,
      scaledScore: a.scaledScore ?? 0,
      maxScale: getStrategy(a.paper.exam.slug).maxScale,
      submittedAt: a.submittedAt,
      timeSpent: a.timeSpent,
      percentile: a.percentile ?? 0,
    })),
    totalTime,
    streak,
    skillAverages: [...skillAcc.entries()].map(([skill, s]) => ({
      skill,
      rate: (s.correct / s.total) * 100,
    })),
    weakTags: [...tagAcc.entries()]
      .filter(([, t]) => t.total >= 3 && t.wrong > 0)
      .map(([tag, t]) => ({ tag, rate: (t.wrong / t.total) * 100, wrong: t.wrong, total: t.total }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8),
    progress: attempts.map((a, i) => ({
      index: i + 1,
      // Chuẩn hoá về % để các kỳ thi khác thang vẫn vẽ chung một đường
      value: ((a.scaledScore ?? 0) / getStrategy(a.paper.exam.slug).maxScale) * 100,
      date: a.submittedAt,
    })),
  }
}
