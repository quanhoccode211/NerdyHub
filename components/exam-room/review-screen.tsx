'use client'

import { useState } from 'react'
import type { RoomSection } from '@/lib/attempt-service'
import { SKILL_LABELS, type Skill } from '@/lib/enums'
import { FlagIcon, WarningIcon, XIcon } from '../shell/icons'
import { useModal } from '../shell/use-modal'
import { isAnswered, useExamStore, useProgressSummaryFromStore } from './store-helpers'

/**
 * Màn hình xem lại trước khi nộp (SPEC F2.6).
 * Nêu rõ số câu chưa làm / đã đánh dấu, cho nhảy tới bất kỳ câu nào,
 * và yêu cầu xác nhận 2 bước nếu còn câu trống.
 */
export function ReviewScreen({
  sections,
  onClose,
  onJump,
  onSubmit,
  submitting,
}: {
  sections: RoomSection[]
  onClose: () => void
  onJump: (questionId: string, sectionId: string) => void
  onSubmit: () => void
  submitting: boolean
}) {
  const answers = useExamStore((s) => s.answers)
  const summary = useProgressSummaryFromStore(sections)
  const needsConfirm = summary.unanswered > 0
  const dialogRef = useModal<HTMLDivElement>(true, onClose)

  return (
    // Nền đóng khi bấm ra ngoài. Trước đây khối này khai `role="dialog"` nhưng
    // không có onClick, nên thao tác quen thuộc nhất với hộp thoại lặng lẽ vô hiệu.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] bg-card outline-none sm:rounded-[28px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="review-title" className="text-[23px] font-bold">
              Xem lại trước khi nộp
            </h2>
            <p className="mt-1 text-[15px] text-muted-strong">
              Đã làm {summary.answered}/{summary.total} câu
              {summary.flagged > 0 && ` · ${summary.flagged} câu đánh dấu`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted hover:bg-soft"
            aria-label="Đóng"
          >
            <XIcon size={18} />
          </button>
        </header>

        {needsConfirm && (
          <div className="flex items-center gap-3 bg-amber-soft px-6 py-3.5 text-[15px] font-medium text-amber">
            <WarningIcon size={18} />
            {/* Bọc <span>: trong flex, "Còn", {số} và phần chữ còn lại là ba item
                riêng, nên `gap-3` chèn khoảng trắng vào hai bên con số. */}
            <span>Còn {summary.unanswered} câu chưa làm. Câu bỏ trống được tính 0 điểm.</span>
          </div>
        )}

        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">
          {sections.map((section) => (
            <section key={section.id} className="mb-6 last:mb-0">
              <h3 className="mb-3 text-[14px] font-semibold tracking-wide text-muted uppercase">
                {SKILL_LABELS[section.skill as Skill]} — {section.title}
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
                {section.questions.map((q) => {
                  const a = answers[q.id]
                  const answered = isAnswered(a)
                  const flagged = a?.isFlagged ?? false
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onJump(q.id, section.id)}
                      aria-label={`Tới câu ${q.number}${answered ? ', đã làm' : ', chưa làm'}`}
                      className={`relative flex h-11 w-full items-center justify-center rounded-xl text-[15px] font-semibold transition-colors ${
                        answered
                          ? 'bg-ink text-[var(--color-accent-fg)] hover:bg-ink/85'
                          : 'border-2 border-red/30 bg-red-soft text-red hover:border-red'
                      } ${flagged ? 'ring-2 ring-amber ring-offset-1' : ''}`}
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
            </section>
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost">
            Quay lại làm bài
          </button>
          <SubmitButton needsConfirm={needsConfirm} onSubmit={onSubmit} submitting={submitting} />
        </footer>
      </div>
    </div>
  )
}

/** Xác nhận 2 bước khi còn câu chưa làm (SPEC F2.6). */
function SubmitButton({
  needsConfirm,
  onSubmit,
  submitting,
}: {
  needsConfirm: boolean
  onSubmit: () => void
  submitting: boolean
}) {
  const [armed, setArmed] = useState(false)

  if (submitting) {
    return (
      <button type="button" disabled className="btn-primary opacity-70">
        Đang nộp bài…
      </button>
    )
  }

  if (needsConfirm && !armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="btn-primary">
        Nộp bài
      </button>
    )
  }

  return (
    <button type="button" onClick={onSubmit} className="btn-primary bg-red shadow-none">
      {needsConfirm ? 'Chắc chắn nộp, chấp nhận bỏ trống' : 'Xác nhận nộp bài'}
    </button>
  )
}
