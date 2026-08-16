import type { QuestionType, Skill } from '../enums'

/** Một câu hỏi đã kèm đáp án đúng — chỉ tồn tại phía server. */
export type GradableQuestion = {
  id: string
  type: QuestionType
  points: number
  skill: Skill
  sectionId: string
  correctChoiceIds: string[]
  correctText: string[]
}

/** Đáp án thí sinh chọn. */
export type SubmittedAnswer = {
  questionId: string
  selectedChoiceIds: string[]
  textAnswer: string | null
}

/** Kết quả chấm từng câu. */
export type GradedAnswer = {
  questionId: string
  /** null = chưa chấm tự động (ESSAY / SPEAKING) */
  isCorrect: boolean | null
  pointsEarned: number
  pointsPossible: number
}

export type SectionBreakdown = {
  sectionId: string
  skill: Skill
  earned: number
  possible: number
  percent: number
}

export type RawResult = {
  answers: GradedAnswer[]
  earnedPoints: number
  /** Chỉ tính các câu chấm được — câu ESSAY/SPEAKING không nằm trong mẫu số */
  totalPoints: number
  percent: number
  correctCount: number
  gradedCount: number
  ungradedCount: number
  bySection: SectionBreakdown[]
  bySkill: Record<string, { earned: number; possible: number; percent: number }>
}

export type ScaledResult = {
  scaledScore: number
  /** Nhãn theo thang của kỳ thi: "Bậc 4 (B2)", "4급"… */
  label: string | null
  /** Điểm quy đổi theo từng kỹ năng */
  sectionScores: Record<string, number>
  /** Thang tối đa để hiển thị "7,5 / 10" */
  maxScale: number
}

/** Dòng quy đổi lấy từ bảng ScoreConversion — SPEC F3: không hardcode trong code. */
export type ConversionRow = {
  examSlug: string
  levelSlug: string | null
  skill: string | null
  minRaw: number
  maxRaw: number
  scaled: number
  label: string | null
}

export type ScalingContext = {
  examSlug: string
  levelSlug: string | null
  conversions: ConversionRow[]
}

/**
 * SPEC F3. Thêm kỳ thi mới = thêm một strategy + dữ liệu quy đổi,
 * KHÔNG sửa code chấm hiện có.
 */
export interface ScoringStrategy {
  examSlug: string
  /** Thang điểm tối đa của kỳ thi, dùng khi không có bảng quy đổi. */
  maxScale: number
  /** MULTI_CHOICE: chấm từng phần hay all-or-nothing. */
  partialCreditForMultiChoice: boolean
  scoreRaw(questions: GradableQuestion[], answers: SubmittedAnswer[]): RawResult
  scale(raw: RawResult, ctx: ScalingContext): ScaledResult
}
