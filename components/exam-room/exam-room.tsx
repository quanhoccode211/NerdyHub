'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExamRoomData } from '@/lib/attempt-service'
import { SKILL_LABELS, type Skill } from '@/lib/enums'
import { ChevronRightIcon, TasksIcon, WarningIcon, XIcon } from '../shell/icons'
import { AudioPlayer } from './audio-player'
import { PassageView } from './passage-view'
import { QuestionNav } from './question-nav'
import { QuestionView } from './question-view'
import { ReviewScreen } from './review-screen'
import { clearLocal, requeue, useExamStore } from './store'
import { useProgressSummaryFromStore } from './store-helpers'
import { SyncIndicator } from './sync-indicator'
import { Timer, TimeWarningBanner } from './timer'
import { useSync, type SyncGoneReason } from './use-sync'

/**
 * Phòng thi (SPEC F2) — trọng tâm sản phẩm.
 * Toàn màn hình, không có rail điều hướng: rời phòng thi phải là hành động
 * có chủ đích, không phải một cú click nhầm vào menu.
 */
export function ExamRoom({ data }: { data: ExamRoomData }) {
  const router = useRouter()
  const hydrate = useExamStore((s) => s.hydrate)
  const currentSectionId = useExamStore((s) => s.currentSectionId)
  const currentQuestionId = useExamStore((s) => s.currentQuestionId)
  const setSection = useExamStore((s) => s.setSection)
  const goToQuestion = useExamStore((s) => s.goToQuestion)
  const setSubmitted = useExamStore((s) => s.setSubmitted)

  const storeAttemptId = useExamStore((s) => s.attemptId)
  const storeHydrated = useExamStore((s) => s.hydrated)
  const [showReview, setShowReview] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [splitPercent, setSplitPercent] = useState(50)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [autoSubmitting, setAutoSubmitting] = useState(false)
  const locked = useExamStore((s) => s.locked)

  const submitInFlightRef = useRef(false)
  const submitDoneRef = useRef(false)
  const autoRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoFailuresRef = useRef(0)
  /* useSync cần gọi ngược vào submit, còn submit cần stop() của useSync —
     một ref cắt vòng phụ thuộc đó. */
  const submitRef = useRef<(auto: boolean) => void>(() => {})

  // Lớp 3: nạp trạng thái từ server rồi hợp nhất với sessionStorage
  useEffect(() => {
    hydrate(data)
  }, [data, hydrate])

  /**
   * Store là singleton cấp module, sống sót qua điều hướng client-side. Chừng nào
   * nó còn giữ attempt cũ thì mọi giá trị trong đó — nhất là mốc đồng hồ — đều
   * thuộc về bài khác. Khoá theo attemptId, không chỉ theo cờ hydrated.
   */
  const ready = storeHydrated && storeAttemptId === data.attempt.id

  // Server nói hết giờ thì TIN SERVER: đồng hồ client có thể sai, bị dừng ở
  // debugger, hoặc tab bị treo. Trước đây cờ này được gửi về mà không ai đọc.
  const onSyncExpired = useCallback(() => {
    submitRef.current(true)
  }, [])

  const onSyncGone = useCallback(
    (reason: SyncGoneReason) => {
      // 403/404/400: giữ nguyên màn hình. Chỉ báo đã chuyển sang 'Đã ngừng lưu'
      // và beforeunload đã nhả — người dùng còn thấy bài của mình để chép lại.
      if (reason !== 'not_in_progress') return

      /*
        Bài đã nộp hoặc hết hạn ở nơi khác (tab thứ hai, hoặc server tự chấm khi
        vào lại). Ở lại phòng chỉ sinh ra thao tác không bao giờ lưu được.
        Bản nháp cục bộ giờ CŨ HƠN bài đã chấm; để lại thì trang xem lại sẽ merge
        nó đè lên đáp án đã chấm.
      */
      useExamStore.getState().lock()
      submitDoneRef.current = true
      clearLocal(data.attempt.id)
      router.replace(`/ket-qua/${data.attempt.id}`)
    },
    [data.attempt.id, router],
  )

  const { stop, resume } = useSync(data.attempt.id, ready && !submitting, {
    onExpired: onSyncExpired,
    onGone: onSyncGone,
  })

  const section = useMemo(
    () => data.sections.find((s) => s.id === currentSectionId) ?? data.sections[0],
    [data.sections, currentSectionId],
  )
  const summary = useProgressSummaryFromStore(data.sections)

  const submit = useCallback(
    async (auto = false) => {
      if (submitDoneRef.current || submitInFlightRef.current) return
      submitInFlightRef.current = true
      setSubmitting(true)
      setSubmitError(null)
      if (auto) setAutoSubmitting(true)

      /*
        Dừng autosave và CHỜ request đang bay settle trước khi gom batch cuối.
        `await flush()` cũ trả về ngay khi có request đang bay, nên batch đó có
        thể hỏng SAU lúc chấm và bị requeue vào một store đã submitted — đáp án
        nằm đó vĩnh viễn, không ai gửi, mà bài thì đã có điểm.
      */
      await stop()

      const store = useExamStore.getState()
      const batch = store.takeDirtyBatch()

      try {
        const res = await fetch(`/api/attempts/${data.attempt.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: batch.answers.map((a) => ({
              questionId: a.questionId,
              selectedChoiceIds: a.patch.selectedChoiceIds,
              textAnswer: a.patch.textAnswer,
              isFlagged: a.patch.isFlagged,
              timeSpent: a.patch.timeSpent,
              changedCount: a.patch.changedCount,
            })),
            annotations: [
              ...batch.annotations.map((an) => ({
                id: an.id,
                targetType: an.targetType as 'passage' | 'question',
                targetId: an.targetId,
                type: an.type,
                startOffset: an.startOffset,
                endOffset: an.endOffset,
                selectedText: an.selectedText,
                color: an.color,
                noteContent: an.noteContent,
              })),
              // takeDirtyBatch đã dọn sạch tập deleted rồi — bỏ nó ở đây là
              // highlight vừa xoá sống lại ở trang xem lại.
              ...batch.deleted.map((id) => ({ id, deleted: true as const })),
            ],
            timeSpent: store.mode === 'PRACTICE' ? store.readClock() : undefined,
          }),
        })
        if (!res.ok) throw new Error(`submit_${res.status}`)

        submitDoneRef.current = true
        setSubmitted()
        clearLocal(data.attempt.id) // dọn bản nháp cục bộ, tránh hydrate nhầm lần sau
        // replace chứ không push: Back không được quay lại phòng thi đã nộp
        router.replace(`/ket-qua/${data.attempt.id}`)
      } catch {
        requeue(batch) // không mất gì, lần thử sau gửi lại

        if (auto) {
          /*
            Hết giờ thì KHÔNG được bỏ cuộc. Bản cũ reset cờ rồi ngồi chờ Timer
            gọi lại, nhưng `firedRef` của Timer đã cháy vĩnh viễn nên không bao
            giờ có lần gọi đó.
          */
          autoFailuresRef.current += 1
          setSubmitError('Hết giờ. Đang nộp bài — kết nối trục trặc, hệ thống sẽ tự thử lại.')
          const delay =
            Math.min(30_000, 1_000 * 2 ** autoFailuresRef.current) * (0.5 + Math.random() * 0.5)
          autoRetryRef.current = setTimeout(() => {
            autoRetryRef.current = null
            submitInFlightRef.current = false
            submitRef.current(true)
          }, delay)
          return // giữ submitting = true: đã hết giờ, không cho làm tiếp
        }

        // Nộp thủ công: báo lỗi ngay trong giao diện. alert() khoá luồng chính
        // và che mất đồng hồ đúng lúc người dùng cần nhìn nó nhất.
        setSubmitError(
          'Không nộp được bài. Bài làm của bạn vẫn được giữ — kiểm tra kết nối rồi thử lại.',
        )
        setSubmitting(false)
        resume()
      } finally {
        if (!submitDoneRef.current && !auto) submitInFlightRef.current = false
      }
    },
    [data.attempt.id, stop, resume, router, setSubmitted],
  )

  useEffect(() => {
    submitRef.current = (auto: boolean) => void submit(auto)
  }, [submit])

  useEffect(
    () => () => {
      if (autoRetryRef.current) clearTimeout(autoRetryRef.current)
    },
    [],
  )

  // Hết giờ -> tự nộp, không có ngoại lệ (F2.2). Timer bắn theo TRẠNG THÁI nên
  // có thể gọi liên tục; chống gọi chồng nằm ở submit().
  const onExpire = useCallback(() => {
    submitRef.current(true)
  }, [])

  // Điều hướng bàn phím (SPEC mục 6: phòng thi phải dùng được hoàn toàn bằng bàn phím)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return
      if (!section) return

      const idx = section.questions.findIndex((q) => q.id === currentQuestionId)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const next = section.questions[idx + 1]
        if (next) {
          e.preventDefault()
          goToQuestion(next.id, section.id)
          document.getElementById(`question-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prev = section.questions[idx - 1]
        if (prev) {
          e.preventDefault()
          goToQuestion(prev.id, section.id)
          document.getElementById(`question-${prev.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [section, currentQuestionId, goToQuestion])

  // Kéo thanh chia đôi màn hình (F2.1)
  const dragRef = useRef<HTMLDivElement>(null)
  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const container = dragRef.current?.parentElement
    if (!container) return

    const onMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setSplitPercent(Math.min(75, Math.max(25, pct)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  if (!section) {
    return <p className="p-10 text-center text-muted">Đề thi này chưa có nội dung.</p>
  }

  // Không dựng phòng thi khi store còn thuộc về attempt khác — đồng hồ và
  // đáp án hiển thị lúc đó đều là của bài cũ.
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-[16px] text-muted">Đang mở phòng thi…</p>
      </div>
    )
  }

  const jumpTo = (questionId: string, sectionId: string) => {
    goToQuestion(questionId, sectionId)
    setShowReview(false)
    setShowNav(false)
    setTimeout(() => {
      document
        .getElementById(`question-${questionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }

  const hasPassages = section.passages.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header cố định */}
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold md:text-[18px]">{data.paper.title}</h1>
            <div className="mt-0.5 flex items-center gap-3 text-[13.5px] text-muted">
              <span>
                {SKILL_LABELS[section.skill as Skill]} · {summary.answered}/{summary.total} câu
              </span>
              <SyncIndicator />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Timer attemptId={data.attempt.id} onExpire={onExpire} />
            <button
              type="button"
              onClick={() => setShowNav(true)}
              className="btn-ghost xl:hidden"
              aria-label="Danh sách câu hỏi"
            >
              <TasksIcon size={20} />
            </button>
            <button
              type="button"
              onClick={() => setShowReview(true)}
              disabled={submitting || locked}
              className="btn-primary px-4 py-2.5 text-[15px] disabled:opacity-60"
            >
              Nộp bài
            </button>
          </div>
        </div>

        {/* Tab chuyển phần */}
        {data.sections.length > 1 && (
          <div className="thin-scroll flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:px-6">
            {data.sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSection(s.id)
                  const first = s.questions[0]
                  if (first) goToQuestion(first.id, s.id)
                }}
                className={`flex-none rounded-pill px-4 py-2 text-[14.5px] font-medium transition-colors ${
                  s.id === section.id
                    ? 'bg-purple text-white'
                    : 'text-muted-strong hover:bg-soft'
                }`}
              >
                {SKILL_LABELS[s.skill as Skill]} — {s.title}
              </button>
            ))}
          </div>
        )}

        <TimeWarningBanner />

        {/* Lỗi nộp bài — thay cho alert(), vốn khoá luồng chính và che đồng hồ */}
        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-3 bg-red-soft px-5 py-3 text-[15.5px] font-medium text-red"
          >
            <WarningIcon size={18} />
            <span className="flex-1">{submitError}</span>
            {!autoSubmitting && (
              <button
                type="button"
                onClick={() => void submit()}
                className="flex-none rounded-pill px-3 py-1 underline underline-offset-2"
              >
                Thử lại
              </button>
            )}
          </div>
        )}
      </header>

      {/* Nội dung */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {section.instructions && (
            <p className="border-b border-line bg-white px-4 py-3 text-[14.5px] leading-relaxed text-muted-strong md:px-6">
              {section.instructions}
            </p>
          )}

          {section.audioUrl && (
            <div className="px-4 pt-4 md:px-6">
              <AudioPlayer
                src={section.audioUrl}
                mode={section.audioPlayMode}
                sectionTitle={section.title}
              />
            </div>
          )}

          {hasPassages ? (
            // Split view: đoạn văn trái, câu hỏi phải, kéo được thanh chia
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div
                className="thin-scroll overflow-y-auto p-4 md:p-6 lg:max-h-[calc(100vh-190px)]"
                style={{ flexBasis: `${splitPercent}%` }}
              >
                {section.passages.map((p) => (
                  <PassageView key={p.id} passage={p} />
                ))}
              </div>

              <div
                ref={dragRef}
                onPointerDown={onDragStart}
                role="separator"
                aria-label="Kéo để đổi tỉ lệ chia"
                aria-orientation="vertical"
                className="hidden w-1.5 flex-none cursor-col-resize bg-line transition-colors hover:bg-purple lg:block"
              />

              <div
                className="thin-scroll flex flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:max-h-[calc(100vh-190px)]"
                style={{ flexBasis: `${100 - splitPercent}%` }}
              >
                {section.questions.map((q) => (
                  <QuestionView key={q.id} question={q} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4 p-4 md:p-6">
              {section.questions.map((q) => (
                <QuestionView key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>

        {/* Thanh điều hướng câu hỏi — cố định trên desktop */}
        <aside className="hidden w-[280px] flex-none overflow-y-auto border-l border-line bg-white p-5 xl:block">
          <QuestionNav sections={data.sections} />
          <button
            type="button"
            onClick={() => setShowReview(true)}
            className="btn-secondary mt-5 w-full"
          >
            Xem lại & nộp
            <ChevronRightIcon size={16} />
          </button>
        </aside>
      </div>

      {/* Drawer điều hướng trên mobile */}
      {showNav && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-ink/40 xl:hidden"
          onClick={() => setShowNav(false)}
          role="presentation"
        >
          <div
            className="thin-scroll w-[300px] max-w-[85vw] overflow-y-auto bg-white p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Danh sách câu hỏi"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold">Danh sách câu</h2>
              <button
                type="button"
                onClick={() => setShowNav(false)}
                className="rounded-xl p-2 text-muted hover:bg-soft"
                aria-label="Đóng"
              >
                <XIcon size={16} />
              </button>
            </div>
            <QuestionNav sections={data.sections} onNavigate={() => setShowNav(false)} />
          </div>
        </div>
      )}

      {showReview && (
        <ReviewScreen
          sections={data.sections}
          onClose={() => setShowReview(false)}
          onJump={jumpTo}
          onSubmit={() => void submit()}
          submitting={submitting}
        />
      )}
    </div>
  )
}
