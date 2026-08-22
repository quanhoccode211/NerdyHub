import { gradeAll } from './grader'
import type {
  ConversionRow,
  GradableQuestion,
  RawResult,
  ScaledResult,
  ScalingContext,
  ScoringStrategy,
  SubmittedAnswer,
} from './types'

/**
 * Quy đổi % đúng sang thang điểm của kỳ thi bằng bảng ScoreConversion trong DB.
 * Không có dòng nào khớp -> nội suy tuyến tính theo maxScale.
 */
function convert(
  percent: number,
  ctx: ScalingContext,
  maxScale: number,
  skill?: string,
): { scaled: number; label: string | null } {
  const candidates = ctx.conversions.filter((c) => {
    if (c.examSlug !== ctx.examSlug) return false
    // levelSlug null = áp cho mọi cấp độ
    if (c.levelSlug !== null && c.levelSlug !== ctx.levelSlug) return false
    if ((c.skill ?? null) !== (skill ?? null)) return false
    return percent >= c.minRaw && percent <= c.maxRaw
  })

  if (candidates.length > 0) {
    // Ưu tiên dòng khớp đúng cấp độ hơn dòng áp chung
    const best =
      candidates.find((c) => c.levelSlug === ctx.levelSlug) ?? candidates[0]
    // scaled = 0 dùng làm cờ "theo tỉ lệ" (xem seed THPTQG)
    if (best.scaled === 0 && best.minRaw === 0 && best.maxRaw === 100) {
      return { scaled: round1((percent / 100) * maxScale), label: best.label }
    }
    return { scaled: best.scaled, label: best.label }
  }

  return { scaled: round1((percent / 100) * maxScale), label: null }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Thân chung: mọi strategy chỉ khác nhau ở maxScale và quy tắc MULTI_CHOICE. */
function makeStrategy(config: {
  examSlug: string
  maxScale: number
  partialCreditForMultiChoice: boolean
  /** Quy đổi riêng cho điểm từng kỹ năng, mặc định dùng cùng thang chia đều */
  skillMaxScale?: number
}): ScoringStrategy {
  const skillMax = config.skillMaxScale ?? config.maxScale

  return {
    examSlug: config.examSlug,
    maxScale: config.maxScale,
    partialCreditForMultiChoice: config.partialCreditForMultiChoice,

    scoreRaw(questions: GradableQuestion[], answers: SubmittedAnswer[]): RawResult {
      return gradeAll(questions, answers, config.partialCreditForMultiChoice)
    },

    scale(raw: RawResult, ctx: ScalingContext): ScaledResult {
      const overall = convert(raw.percent, ctx, config.maxScale)

      const sectionScores: Record<string, number> = {}
      for (const [skill, agg] of Object.entries(raw.bySkill)) {
        const converted = convert(agg.percent, ctx, skillMax, skill)
        sectionScores[skill] = converted.scaled
      }

      return {
        scaledScore: overall.scaled,
        label: overall.label,
        sectionScores,
        maxScale: config.maxScale,
      }
    },
  }
}

// ---- Các kỳ thi v1 (SPEC F3) -------------------------------------------------

export const VstepStrategy = makeStrategy({
  examSlug: 'vstep',
  maxScale: 10, // VSTEP: 0–10
  partialCreditForMultiChoice: false,
})

export const TopikStrategy = makeStrategy({
  examSlug: 'topik',
  maxScale: 300, // TOPIK: 0–300
  partialCreditForMultiChoice: false,
  skillMaxScale: 100, // mỗi kỹ năng 0–100
})

export const HskStrategy = makeStrategy({
  examSlug: 'hsk',
  maxScale: 300, // HSK: 0–300
  partialCreditForMultiChoice: false,
  skillMaxScale: 100,
})

export const JlptStrategy = makeStrategy({
  examSlug: 'jlpt',
  maxScale: 180, // JLPT: 0–180
  partialCreditForMultiChoice: false,
  skillMaxScale: 60,
})

export const GoetheStrategy = makeStrategy({
  examSlug: 'goethe',
  maxScale: 100,
  partialCreditForMultiChoice: true,
  skillMaxScale: 25,
})

/**
 * IELTS: band 0–9, KHÔNG phải thang phần trăm.
 *
 * `skillMaxScale` cũng là 9 chứ không chia nhỏ: band của từng kỹ năng và band
 * tổng dùng CHUNG một thang trong IELTS — Reading 6.5 và Overall 6.5 là cùng
 * một đơn vị. Khác hẳn TOPIK (300 = 3 x 100) hay Goethe (100 = 4 x 25), nơi
 * điểm kỹ năng là một phần của tổng.
 */
export const IeltsStrategy = makeStrategy({
  examSlug: 'ielts',
  maxScale: 9,
  /*
    Bật chấm từng phần vì dạng "Choose TWO letters" của IELTS là HAI câu, mỗi
    lựa chọn đúng một điểm — không phải một câu ăn cả ngã cả. Ở đây nó dựng
    thành MỘT câu MULTI_CHOICE `points: 2`, nên không bật thì thí sinh chọn
    đúng một trong hai vẫn bị 0, lệch hẳn với đề thật.
  */
  partialCreditForMultiChoice: true,
})

/** Mặc định cho mọi kỳ thi chưa có strategy riêng — thang 0–10 kiểu VN. */
export const GenericPercentStrategy = makeStrategy({
  examSlug: '*',
  maxScale: 10,
  partialCreditForMultiChoice: true,
})

const REGISTRY: ScoringStrategy[] = [
  IeltsStrategy,
  VstepStrategy,
  TopikStrategy,
  HskStrategy,
  JlptStrategy,
  GoetheStrategy,
]

/**
 * Chọn strategy theo slug kỳ thi.
 * Thêm kỳ thi mới: thêm một dòng vào REGISTRY + dữ liệu ScoreConversion. Hết.
 */
export function getStrategy(examSlug: string): ScoringStrategy {
  return REGISTRY.find((s) => s.examSlug === examSlug) ?? GenericPercentStrategy
}

export type { ConversionRow }
