'use client'

import type { RoomSection } from '@/lib/attempt-service'
import { useExamStore } from './store'

export { useExamStore }

export type ProgressSummary = {
  total: number
  answered: number
  flagged: number
  unanswered: number
}

/** Một câu được coi là "đã làm" khi có lựa chọn hoặc có text khác rỗng. */
export function isAnswered(a?: {
  selectedChoiceIds: string[]
  textAnswer: string | null
}): boolean {
  if (!a) return false
  return a.selectedChoiceIds.length > 0 || (a.textAnswer !== null && a.textAnswer.trim() !== '')
}

/** Tóm tắt tiến độ dùng chung cho header, thanh điều hướng và màn hình xem lại. */
export function useProgressSummaryFromStore(sections: RoomSection[]): ProgressSummary {
  const answers = useExamStore((s) => s.answers)

  const all = sections.flatMap((s) => s.questions)
  let answered = 0
  let flagged = 0
  for (const q of all) {
    const a = answers[q.id]
    if (isAnswered(a)) answered++
    if (a?.isFlagged) flagged++
  }
  return { total: all.length, answered, flagged, unanswered: all.length - answered }
}
