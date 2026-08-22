import { UNGRADED_TYPES } from '../enums'
import type {
  GradableQuestion,
  GradedAnswer,
  RawResult,
  SectionBreakdown,
  SubmittedAnswer,
} from './types'

/**
 * Chuẩn hoá đáp án tự luận ngắn trước khi so khớp — SPEC F3:
 * không phân biệt hoa thường, bỏ khoảng trắng thừa.
 * Bỏ luôn dấu câu ở hai đầu vì thí sinh hay gõ kèm dấu chấm.
 */
export function normalizeText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[.,;:!?'"()[\]]+|[.,;:!?'"()[\]]+$/g, '')
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((x) => setB.has(x))
}

/** Chấm một câu. Trả pointsEarned và isCorrect (null nếu không tự chấm được). */
function gradeOne(
  q: GradableQuestion,
  answer: SubmittedAnswer | undefined,
  partialCreditForMultiChoice: boolean,
): GradedAnswer {
  // ESSAY: v1 không chấm tự động, loại khỏi tổng điểm
  if (UNGRADED_TYPES.includes(q.type)) {
    return { questionId: q.id, isCorrect: null, pointsEarned: 0, pointsPossible: q.points }
  }

  const selected = answer?.selectedChoiceIds ?? []
  const text = answer?.textAnswer ?? null
  const noAnswer = selected.length === 0 && (text === null || text.trim() === '')
  if (noAnswer) {
    return { questionId: q.id, isCorrect: false, pointsEarned: 0, pointsPossible: q.points }
  }

  switch (q.type) {
    case 'SINGLE_CHOICE':
    case 'TRUE_FALSE_NOTGIVEN': {
      const correct = selected.length === 1 && q.correctChoiceIds.includes(selected[0])
      return {
        questionId: q.id,
        isCorrect: correct,
        pointsEarned: correct ? q.points : 0,
        pointsPossible: q.points,
      }
    }

    case 'MULTI_CHOICE': {
      const exact = sameSet(selected, q.correctChoiceIds)
      if (exact) {
        return { questionId: q.id, isCorrect: true, pointsEarned: q.points, pointsPossible: q.points }
      }
      if (!partialCreditForMultiChoice) {
        return { questionId: q.id, isCorrect: false, pointsEarned: 0, pointsPossible: q.points }
      }
      // Chấm từng phần: đúng cộng, sai trừ, không xuống dưới 0
      const correctSet = new Set(q.correctChoiceIds)
      const hits = selected.filter((s) => correctSet.has(s)).length
      const misses = selected.length - hits
      const ratio = Math.max(0, (hits - misses) / Math.max(1, q.correctChoiceIds.length))
      return {
        questionId: q.id,
        isCorrect: false,
        pointsEarned: Number((q.points * ratio).toFixed(4)),
        pointsPossible: q.points,
      }
    }

    case 'MATCHING':
    case 'ORDERING': {
      // Đúng thứ tự mới tính điểm
      const correct =
        selected.length === q.correctChoiceIds.length &&
        selected.every((id, i) => id === q.correctChoiceIds[i])
      return {
        questionId: q.id,
        isCorrect: correct,
        pointsEarned: correct ? q.points : 0,
        pointsPossible: q.points,
      }
    }

    case 'FILL_BLANK':
    case 'SHORT_ANSWER': {
      const given = normalizeText(text ?? '')
      const accepted = q.correctText.map(normalizeText).filter(Boolean)
      const correct = accepted.length > 0 && accepted.includes(given)
      return {
        questionId: q.id,
        isCorrect: correct,
        pointsEarned: correct ? q.points : 0,
        pointsPossible: q.points,
      }
    }

    default:
      return { questionId: q.id, isCorrect: null, pointsEarned: 0, pointsPossible: q.points }
  }
}

/**
 * Chấm toàn bộ bài. Dùng chung cho mọi kỳ thi — phần khác nhau giữa các kỳ thi
 * nằm ở bước quy đổi thang điểm (scale), không nằm ở đây.
 */
export function gradeAll(
  questions: GradableQuestion[],
  answers: SubmittedAnswer[],
  partialCreditForMultiChoice: boolean,
): RawResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]))
  const graded = questions.map((q) => gradeOne(q, answerMap.get(q.id), partialCreditForMultiChoice))
  const gradedById = new Map(graded.map((g) => [g.questionId, g]))

  let earnedPoints = 0
  let totalPoints = 0
  let correctCount = 0
  let gradedCount = 0
  let ungradedCount = 0

  const sectionAcc = new Map<string, SectionBreakdown>()
  const skillAcc: Record<string, { earned: number; possible: number; percent: number }> = {}

  for (const q of questions) {
    const g = gradedById.get(q.id)
    if (!g) continue

    if (g.isCorrect === null) {
      ungradedCount++
      continue // không đưa vào mẫu số
    }

    gradedCount++
    earnedPoints += g.pointsEarned
    totalPoints += g.pointsPossible
    if (g.isCorrect) correctCount++

    const section = sectionAcc.get(q.sectionId) ?? {
      sectionId: q.sectionId,
      skill: q.skill,
      earned: 0,
      possible: 0,
      percent: 0,
    }
    section.earned += g.pointsEarned
    section.possible += g.pointsPossible
    sectionAcc.set(q.sectionId, section)

    const skill = skillAcc[q.skill] ?? { earned: 0, possible: 0, percent: 0 }
    skill.earned += g.pointsEarned
    skill.possible += g.pointsPossible
    skillAcc[q.skill] = skill
  }

  const bySection = [...sectionAcc.values()].map((s) => ({
    ...s,
    percent: s.possible > 0 ? (s.earned / s.possible) * 100 : 0,
  }))
  for (const key of Object.keys(skillAcc)) {
    const s = skillAcc[key]
    s.percent = s.possible > 0 ? (s.earned / s.possible) * 100 : 0
  }

  return {
    answers: graded,
    earnedPoints,
    totalPoints,
    percent: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0,
    correctCount,
    gradedCount,
    ungradedCount,
    bySection,
    bySkill: skillAcc,
  }
}
