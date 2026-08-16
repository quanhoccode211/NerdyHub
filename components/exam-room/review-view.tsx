'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ExamRoomData } from '@/lib/attempt-service'
import { SKILL_LABELS, type Skill } from '@/lib/enums'
import { CheckIcon, ChevronRightIcon, FlagIcon, XIcon } from '../shell/icons'
import { PassageView } from './passage-view'
import { QuestionView } from './question-view'
import { useExamStore } from './store'

type Filter = 'all' | 'wrong' | 'flagged'

/**
 * Trang xem lại bài (SPEC F4.2).
 * Dùng lại đúng PassageView/QuestionView của phòng thi ở chế độ readOnly nên
 * highlight và ghi chú hiện lại y như lúc làm bài — không phải render đường khác.
 */
export function ReviewView({
  data,
  initialFilter = 'all',
}: {
  data: ExamRoomData
  initialFilter?: Filter
}) {
  const hydrate = useExamStore((s) => s.hydrate)
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [sectionId, setSectionId] = useState(data.sections[0]?.id ?? '')

  useEffect(() => {
    hydrate(data)
  }, [data, hydrate])

  const resultByQuestion = useMemo(
    () => new Map(data.answers.map((a) => [a.questionId, a])),
    [data.answers],
  )

  const section = data.sections.find((s) => s.id === sectionId) ?? data.sections[0]

  /*
    BỘ LỌC CHẠY XUYÊN PHẦN, không chỉ trong phần đang chọn.

    Link "Xem tất cả N câu sai" từ trang kết quả trỏ tới `?loc=sai`, nhưng phần mặc
    định là `sections[0]`. Câu sai nằm ở phần 2 thì người dùng bấm vào một con số N
    rõ ràng rồi nhận được "Không có câu nào sai trong phần này." — chính xác về mặt
    kỹ thuật và vô dụng về mặt con người.

    Khi lọc, tab chuyển phần cũng bị ẩn: lúc đó "phần đang chọn" không còn nghĩa gì.
  */
  const filtering = filter !== 'all'

  const visibleGroups = useMemo(() => {
    const source = filtering ? data.sections : section ? [section] : []
    return source
      .map((s) => ({
        section: s,
        questions: s.questions.filter((q) => {
          const a = resultByQuestion.get(q.id)
          if (filter === 'wrong') return a?.isCorrect === false
          if (filter === 'flagged') return a?.isFlagged === true
          return true
        }),
      }))
      .filter((g) => g.questions.length > 0)
  }, [data.sections, section, filter, filtering, resultByQuestion])

  const visibleCount = visibleGroups.reduce((n, g) => n + g.questions.length, 0)

  /*
    searchParams đổi sau lần render đầu (điều hướng client-side) thì filter phải
    theo — `useState(initialFilter)` một mình bỏ qua mọi thay đổi sau đó.

    Chỉnh state NGAY TRONG LÚC RENDER thay vì trong useEffect: đây là cách React
    khuyến nghị cho "state phụ thuộc prop". Đặt trong effect thì render đầu tiên
    hiện filter cũ rồi mới nháy sang filter mới.
  */
  const [prevInitialFilter, setPrevInitialFilter] = useState(initialFilter)
  if (prevInitialFilter !== initialFilter) {
    setPrevInitialFilter(initialFilter)
    setFilter(initialFilter)
  }

  const counts = useMemo(() => {
    const all = data.sections.flatMap((s) => s.questions)
    let wrong = 0
    let flagged = 0
    for (const q of all) {
      const a = resultByQuestion.get(q.id)
      if (a?.isCorrect === false) wrong++
      if (a?.isFlagged) flagged++
    }
    return { total: all.length, wrong, flagged }
  }, [data.sections, resultByQuestion])

  if (!section) return null

  return (
    <div className="flex flex-col gap-5">
      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
          Tất cả ({counts.total})
        </FilterTab>
        <FilterTab active={filter === 'wrong'} onClick={() => setFilter('wrong')}>
          <XIcon size={12} /> Chỉ câu sai ({counts.wrong})
        </FilterTab>
        <FilterTab active={filter === 'flagged'} onClick={() => setFilter('flagged')}>
          <FlagIcon size={11} /> Đã đánh dấu ({counts.flagged})
        </FilterTab>
      </div>

      {/* Chuyển phần — ẩn khi đang lọc, vì lúc đó bộ lọc chạy trên mọi phần */}
      {data.sections.length > 1 && !filtering && (
        <div className="thin-scroll flex gap-2 overflow-x-auto">
          {data.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              className={`flex-none rounded-pill px-4 py-2 text-[14.5px] font-medium transition-colors ${
                s.id === section.id ? 'bg-ink text-[var(--color-accent-fg)]' : 'bg-soft text-muted-strong hover:bg-purple-soft'
              }`}
            >
              {SKILL_LABELS[s.skill as Skill]} — {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Transcript — chỉ lộ sau khi nộp (SPEC F2.3) */}
      {section.transcript && (
        <details className="panel p-6">
          <summary className="cursor-pointer text-[16px] font-semibold">
            Transcript phần nghe
          </summary>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted-strong">
            {section.transcript}
          </p>
        </details>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
        {/* Passage giữ nguyên highlight/ghi chú đã tạo lúc làm bài */}
        {section.passages.length > 0 && (
          <div className="panel xl:sticky xl:top-6 p-6">
            {section.passages.map((p) => (
              <PassageView key={p.id} passage={p} readOnly />
            ))}
            <p className="mt-4 border-t border-line pt-3 text-[13.5px] text-muted">
              Highlight và ghi chú của bạn được giữ nguyên từ lúc làm bài.
            </p>
          </div>
        )}

        <div className={section.passages.length > 0 ? 'flex flex-col gap-4' : 'flex flex-col gap-4 xl:col-span-2'}>
          {visibleGroups.map((group) => (
            <section key={group.section.id} className="flex flex-col gap-4">
              {/* Đang lọc thì câu hỏi đến từ nhiều phần — phải nói rõ câu nào ở đâu */}
              {filtering && (
                <h3 className="text-[14px] font-semibold tracking-wide text-muted uppercase">
                  {SKILL_LABELS[group.section.skill as Skill]} — {group.section.title}
                </h3>
              )}
              {group.questions.map((q) => {
                const a = resultByQuestion.get(q.id)
                return (
                  <div key={q.id}>
                    <div className="mb-2 flex items-center gap-2">
                      {a?.isCorrect === true && (
                        <span className="pill bg-green-soft text-green">
                          <CheckIcon size={13} /> Đúng
                        </span>
                      )}
                      {a?.isCorrect === false && (
                        <span className="pill bg-red-soft text-red">
                          <XIcon size={12} /> Sai
                        </span>
                      )}
                      {a?.isCorrect === null && (
                        <span className="pill bg-amber-soft text-amber">Chưa chấm tự động</span>
                      )}
                      {a?.isFlagged && (
                        <span className="pill bg-amber-soft text-amber">
                          <FlagIcon size={11} /> Đã đánh dấu
                        </span>
                      )}
                    </div>
                    <QuestionView question={q} review result={a} />
                  </div>
                )
              })}
            </section>
          ))}

          {visibleCount === 0 && (
            <p className="panel p-8 text-center text-muted">
              {filter === 'wrong'
                ? 'Không có câu nào sai — bạn làm đúng toàn bộ.'
                : filter === 'flagged'
                  ? 'Bạn không đánh dấu câu nào trong bài này.'
                  : 'Phần này chưa có câu hỏi nào.'}
            </p>
          )}
        </div>
      </div>

      <Link href={`/ket-qua/${data.attempt.id}`} className="btn-secondary self-start">
        Quay lại kết quả
        <ChevronRightIcon size={15} />
      </Link>
    </div>
  )
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-pill px-4 py-2 text-[14.5px] font-medium transition-colors ${
        active ? 'bg-purple text-white' : 'bg-soft text-muted-strong hover:bg-purple-soft'
      }`}
    >
      {children}
    </button>
  )
}
