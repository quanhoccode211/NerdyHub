'use client'

import type { RoomQuestion } from '@/lib/attempt-service'
import { CheckIcon, FlagIcon, XIcon } from '../shell/icons'
import { useExamStore } from './store'

/**
 * Hiển thị một câu hỏi và thu đáp án.
 * `review` = true dùng ở trang xem lại: khoá tương tác, hiện đáp án đúng/sai.
 */
export function QuestionView({
  question,
  review = false,
  result,
}: {
  question: RoomQuestion
  review?: boolean
  /**
   * Kết quả chấm từ server — chỉ truyền ở trang xem lại.
   * `undefined` = server chưa gửi (bài chưa nộp), `null` = câu không chấm tự động.
   */
  result?: { isCorrect?: boolean | null }
}) {
  const answer = useExamStore((s) => s.answers[question.id])
  const toggleChoice = useExamStore((s) => s.toggleChoice)
  const setText = useExamStore((s) => s.setText)
  const toggleFlag = useExamStore((s) => s.toggleFlag)

  const selected = answer?.selectedChoiceIds ?? []
  const isMulti = question.type === 'MULTI_CHOICE'
  const isText = question.type === 'FILL_BLANK' || question.type === 'SHORT_ANSWER'
  const isEssay = question.type === 'ESSAY' || question.type === 'SPEAKING'
  const correctIds = question.correctChoiceIds ?? []

  return (
    <article
      id={`question-${question.id}`}
      className="scroll-mt-24 rounded-card bg-white p-5 ring-1 ring-line md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-purple-soft text-[15px] font-bold text-purple">
            {question.number}
          </span>
          <p className="pt-1 text-[16.5px] leading-relaxed font-medium">{question.content}</p>
        </div>

        {!review && (
          <button
            type="button"
            onClick={() => toggleFlag(question.id)}
            aria-pressed={answer?.isFlagged ?? false}
            aria-label="Đánh dấu để xem lại"
            className={`flex flex-none items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
              answer?.isFlagged
                ? 'bg-amber-soft text-amber'
                : 'text-muted hover:bg-soft hover:text-muted-strong'
            }`}
          >
            <FlagIcon size={12} />
            <span className="hidden sm:inline">{answer?.isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
          </button>
        )}
      </div>

      {isEssay ? (
        <div className="mt-4">
          <textarea
            value={answer?.textAnswer ?? ''}
            onChange={(e) => setText(question.id, e.target.value)}
            readOnly={review}
            rows={8}
            placeholder="Viết bài của bạn ở đây…"
            className="w-full resize-y rounded-2xl bg-soft p-4 text-[16px] leading-relaxed outline-none placeholder:text-muted"
          />
          <p className="mt-2 rounded-xl bg-amber-soft px-3 py-2 text-[13.5px] text-amber">
            Phần này chưa được chấm tự động và không tính vào tổng điểm.
          </p>
        </div>
      ) : isText ? (
        <div className="mt-4">
          <input
            type="text"
            value={answer?.textAnswer ?? ''}
            onChange={(e) => setText(question.id, e.target.value)}
            readOnly={review}
            placeholder="Nhập đáp án…"
            className={`w-full rounded-xl bg-soft px-4 py-3 text-[16px] outline-none placeholder:text-muted ${
              review ? (result?.isCorrect ? 'ring-2 ring-green' : 'ring-2 ring-red') : ''
            }`}
          />
          {review && question.correctText && question.correctText.length > 0 && (
            <p className="mt-2 text-[14.5px]">
              <span className="text-muted">Đáp án đúng: </span>
              <span className="font-semibold text-green">{question.correctText.join(' / ')}</span>
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {question.choices.map((choice) => {
            const isSelected = selected.includes(choice.id)
            const isCorrect = correctIds.includes(choice.id)
            const showAsCorrect = review && isCorrect
            const showAsWrong = review && isSelected && !isCorrect

            return (
              <li key={choice.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 transition-colors ${
                    showAsCorrect
                      ? 'bg-green-soft ring-2 ring-green'
                      : showAsWrong
                        ? 'bg-red-soft ring-2 ring-red'
                        : isSelected
                          ? 'bg-purple-soft ring-2 ring-purple'
                          : 'bg-soft hover:bg-purple-soft/60'
                  } ${review ? 'cursor-default' : ''}`}
                >
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={`q-${question.id}`}
                    checked={isSelected}
                    onChange={() => !review && toggleChoice(question.id, choice.id, isMulti)}
                    disabled={review}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-6 w-6 flex-none items-center justify-center text-[13.5px] font-bold ${
                      isMulti ? 'rounded-md' : 'rounded-full'
                    } ${
                      showAsCorrect
                        ? 'bg-green text-white'
                        : showAsWrong
                          ? 'bg-red text-white'
                          : isSelected
                            ? 'bg-purple text-white'
                            : 'bg-white text-muted-strong ring-1 ring-line'
                    }`}
                  >
                    {showAsCorrect ? (
                      <CheckIcon size={13} />
                    ) : showAsWrong ? (
                      <XIcon size={12} />
                    ) : (
                      choice.label
                    )}
                  </span>
                  <span className="pt-0.5 text-[16px] leading-relaxed">{choice.content}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      {review && question.explanation && (
        <div className="mt-4 rounded-2xl bg-purple-soft p-4">
          <h4 className="text-[14px] font-semibold text-purple">Giải thích</h4>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink/80">{question.explanation}</p>
        </div>
      )}

      {review && question.tags && question.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {question.tags.map((t) => (
            <span key={t} className="rounded-pill bg-soft px-2.5 py-1 text-[13px] text-muted-strong">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
