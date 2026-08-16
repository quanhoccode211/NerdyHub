'use client'

import type { RoomSection } from '@/lib/attempt-service'
import { SKILL_LABELS, type Skill } from '@/lib/enums'
import { FlagIcon } from '../shell/icons'
import { useExamStore } from './store'
import { isAnswered } from './store-helpers'

/**
 * Lưới điều hướng câu hỏi (SPEC F2.1).
 *
 * Bốn trạng thái phân biệt bằng CẢ màu VÀ hình dạng — người mù màu vẫn đọc được:
 *   chưa làm  → nền trắng, viền xám, số thường
 *   đã làm    → nền đặc, chữ trắng (khối đặc, tương phản cao)
 *   đánh dấu  → viền cam + icon cờ ở góc
 *   hiện tại  → ring dày bao ngoài
 */
export function QuestionNav({
  sections,
  onNavigate,
}: {
  sections: RoomSection[]
  onNavigate?: () => void
}) {
  const answers = useExamStore((s) => s.answers)
  const currentQuestionId = useExamStore((s) => s.currentQuestionId)
  const goToQuestion = useExamStore((s) => s.goToQuestion)

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="mb-2.5 text-[14px] font-semibold tracking-wide text-muted uppercase">
            {SKILL_LABELS[section.skill as Skill]} · {section.questions.length} câu
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2">
            {section.questions.map((q) => {
              const a = answers[q.id]
              // Dùng chung `isAnswered` với header và màn hình xem lại: ba nơi tự
              // viết lại định nghĩa "đã làm" là ba cơ hội để chúng lệch nhau.
              const answered = isAnswered(a)
              const flagged = a?.isFlagged ?? false
              const current = currentQuestionId === q.id

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    goToQuestion(q.id, section.id)
                    onNavigate?.()
                  }}
                  aria-label={`Câu ${q.number}${answered ? ', đã làm' : ', chưa làm'}${
                    flagged ? ', đã đánh dấu' : ''
                  }`}
                  aria-current={current ? 'true' : undefined}
                  className={`relative flex h-10 w-full items-center justify-center rounded-xl text-[15px] font-semibold transition-all ${
                    answered
                      ? 'bg-ink text-[var(--color-accent-fg)]'
                      : 'border-2 border-line bg-card text-muted-strong hover:border-purple'
                  } ${flagged ? 'ring-2 ring-amber ring-offset-1' : ''} ${
                    current ? 'ring-[3px] ring-purple ring-offset-2' : ''
                  }`}
                >
                  {q.number}
                  {flagged && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-white">
                      <FlagIcon size={8} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <Legend />
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 text-[13.5px] text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-4 w-4 rounded-md border-2 border-line bg-card" /> Chưa làm
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-4 w-4 rounded-md bg-ink" /> Đã làm
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-4 w-4 rounded-md border-2 border-line bg-card ring-2 ring-amber" /> Đánh dấu
      </span>
    </div>
  )
}
