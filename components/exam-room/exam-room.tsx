'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ExamRoomData } from '@/lib/attempt-service'
import { SKILL_LABELS, type Skill } from '@/lib/enums'
import { ChevronRightIcon, TasksIcon, WarningIcon, XIcon } from '../shell/icons'
import { useModal } from '../shell/use-modal'
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
  const [showExit, setShowExit] = useState(false)
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

  /*
    PHÒNG THI CHIẾM TRỌN VIEWPORT — khoá cuộn của tài liệu trong suốt thời gian nó
    sống. Cuộn nằm ở hai khung bên trong (đề đọc / danh sách câu hỏi), không bao giờ
    ở cấp trang.

    Đây là lưới đỡ, không phải cách sửa chính: gốc rễ là những phần tử
    `position: absolute` không có tổ tiên định vị (điển hình là `sr-only` của
    Tailwind) — chúng lấy viewport làm khối chứa, thoát khỏi `overflow` của khung
    cuộn và kéo dài chiều cao tài liệu, để lại một mảng nền trống phía dưới. Mỗi chỗ
    như vậy đã được sửa tại nguồn, nhưng chỉ cần một chỗ mới lọt vào là lỗi quay lại
    y hệt. Khoá ở đây thì cả lớp lỗi đó không còn nhìn thấy được nữa.
  */
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

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

  const { flush, stop, resume } = useSync(data.attempt.id, ready && !submitting, {
    onExpired: onSyncExpired,
    onGone: onSyncGone,
  })

  /*
    Mốc "đã bắt đầu nghe" đi thẳng lên server, không xếp hàng chờ debounce 3 giây.
    Ba giây đó là quá đủ để nghe mấy câu đầu rồi F5 trước khi server kịp biết —
    đúng lỗ hổng làm cam kết "nghe một lần" trở thành hình thức.
  */
  const onAudioStart = useCallback(
    (sectionId: string) => {
      useExamStore.getState().markAudioStarted(sectionId)
      void flush()
    },
    [flush],
  )

  const closeNav = useCallback(() => setShowNav(false), [])
  const closeExit = useCallback(() => setShowExit(false), [])
  const navDrawerRef = useModal<HTMLDivElement>(showNav, closeNav)
  const exitDialogRef = useModal<HTMLDivElement>(showExit, closeExit)

  /**
   * Lưu và thoát — lối ra CÓ CHỦ ĐÍCH khỏi phòng thi.
   *
   * Phòng thi cố ý không có rail điều hướng, nhưng "không có menu" đã bị hiểu thành
   * "không có lối ra nào": chốt duy nhất là `beforeunload`, mà sự kiện đó KHÔNG bắn
   * khi điều hướng nội bộ của Next. Bấm Back là rời phòng kèm mọi thay đổi chưa
   * đồng bộ, không một lời cảnh báo.
   */
  const saveAndExit = useCallback(async () => {
    setShowExit(false)
    await flush()
    router.push(`/de-thi/${data.paper.examSlug}/${data.paper.paperSlug}`)
  }, [flush, router, data.paper.examSlug, data.paper.paperSlug])

  const section = useMemo(
    () => data.sections.find((s) => s.id === currentSectionId) ?? data.sections[0],
    [data.sections, currentSectionId],
  )
  /*
    Header in tên PHẦN đang mở, nên con số cạnh nó cũng phải thuộc phần đó.
    Bản cũ dùng `summary` toàn đề và đọc ra thành "Nghe · 3/120 câu" trong khi phần
    Nghe chỉ có 30 câu — hai phạm vi khác nhau nằm cạnh nhau trong một câu.
    `summary` toàn đề vẫn cần cho màn hình xem lại trước khi nộp.
  */
  const sectionSummary = useProgressSummaryFromStore(useMemo(() => (section ? [section] : []), [section]))

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

  /*
    Điều hướng bàn phím (SPEC mục 6: phòng thi phải dùng được hoàn toàn bằng bàn phím).

    ĐÒI HỎI Alt. Bản cũ bắt mũi tên TRẦN ở mức window và `preventDefault()` cả bốn
    phím, nên người dùng bàn phím không cuộn nổi một bài đọc dài — trong đúng màn
    hình mà globals.css tuyên bố phải điều hướng được hoàn toàn bằng bàn phím. Mũi
    tên trần thuộc về việc cuộn trang; nhảy câu là thao tác của ứng dụng nên phải
    có modifier.

    Nhảy XUYÊN PHẦN: đứng ở câu cuối phần 1 bấm Alt+→ thì sang câu đầu phần 2, thay
    vì im lặng không làm gì.
  */
  const allQuestions = useMemo(
    () => data.sections.flatMap((s) => s.questions.map((q) => ({ q, sectionId: s.id }))),
    [data.sections],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return

      const el = e.target as HTMLElement | null
      // `select` và `contenteditable` cũng nuốt phím — bản cũ chỉ né INPUT/TEXTAREA
      if (
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.tagName === 'SELECT' ||
        el?.isContentEditable
      ) {
        return
      }

      const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
      const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
      if (!forward && !back) return

      const idx = allQuestions.findIndex((item) => item.q.id === currentQuestionId)
      if (idx === -1) return
      const target = allQuestions[idx + (forward ? 1 : -1)]
      if (!target) return

      e.preventDefault()
      goToQuestion(target.q.id, target.sectionId)
      setSection(target.sectionId)
      document
        .getElementById(`question-${target.q.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allQuestions, currentQuestionId, goToQuestion, setSection])

  // Kéo thanh chia đôi màn hình (F2.1)
  const dragRef = useRef<HTMLDivElement>(null)
  const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const container = dragRef.current?.parentElement
    if (!container) return

    /*
      `setPointerCapture` để chuột kéo nhanh ra ngoài cửa sổ không đánh rơi
      `pointerup` — thiếu nó thì thanh chia dính vào con trỏ và không nhả ra nữa.
    */
    const handle = dragRef.current
    handle?.setPointerCapture?.(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setSplitPercent(Math.min(75, Math.max(25, pct)))
    }
    const onUp = () => {
      handle?.releasePointerCapture?.(e.pointerId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  /** Thanh chia phải dùng được bằng bàn phím, không chỉ bằng chuột (SPEC mục 6). */
  const onSplitKey = useCallback((e: React.KeyboardEvent) => {
    const STEP = 2
    if (e.key === 'ArrowLeft') setSplitPercent((p) => Math.max(25, p - STEP))
    else if (e.key === 'ArrowRight') setSplitPercent((p) => Math.min(75, p + STEP))
    else if (e.key === 'Home') setSplitPercent(25)
    else if (e.key === 'End') setSplitPercent(75)
    else return
    e.preventDefault()
  }, [])

  if (!section) {
    // Nhóm route phòng thi cố ý không có nav, nên trạng thái rỗng BUỘC phải tự
    // mang theo lối ra — nếu không người dùng chỉ còn nút Back của trình duyệt.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="text-[16px] text-muted">Đề thi này chưa có nội dung.</p>
        <Link href={`/de-thi/${data.paper.examSlug}`} className="btn-primary">
          Xem các đề {data.paper.examName} khác
        </Link>
      </div>
    )
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
    /*
      Chiều cao thật, chia bằng flex — KHÔNG trừ một con số cứng.

      Bản cũ để `calc(100vh-190px)` trên hai khung cuộn, mà 190px là chiều cao header
      ở đúng một trạng thái. Header cao thêm khi có hàng tab phần thi, khi dải cảnh
      báo 5 phút hiện ra, khi có khối hướng dẫn — lúc đó đáy của cả hai khung bị đẩy
      xuống dưới màn hình và không cách nào với tới.

      `dvh` thay cho `vh` để thanh địa chỉ trên mobile không cắt mất phần dưới.
    */
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg">
      {/* Header cố định */}
      <header className="flex-none border-b border-line bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold md:text-[18px]">{data.paper.title}</h1>
            <div className="mt-0.5 flex items-center gap-3 text-[13.5px] text-muted">
              <span>
                {SKILL_LABELS[section.skill as Skill]} · {sectionSummary.answered}/
                {sectionSummary.total} câu
              </span>
              <SyncIndicator />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Timer attemptId={data.attempt.id} onExpire={onExpire} />
            <button
              type="button"
              onClick={() => setShowExit(true)}
              disabled={submitting || locked}
              className="btn-ghost disabled:opacity-60"
            >
              <span className="hidden sm:inline">Lưu và thoát</span>
              <span className="sm:hidden">Thoát</span>
            </button>
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
        {/*
          `min-h-0` ở ĐÂY là bắt buộc, không phải thừa.

          Mặc định `min-height` của một flex item là `auto`, tức là "cao bằng nội
          dung" — nên nếu thiếu, cột này giãn tới ~3700px theo chiều dài danh sách
          câu hỏi, khung `overflow-y-auto` bên trong không còn gì để giới hạn, và
          `overflow-hidden` ở gốc cắt phần thừa. Kết quả người dùng thấy: cuộn
          trang xuống là lộ ra một mảng nền trống mênh mông dưới phòng thi.
        */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {section.instructions && (
            <p className="border-b border-line bg-card px-4 py-3 text-[14.5px] leading-relaxed text-muted-strong md:px-6">
              {section.instructions}
            </p>
          )}

          {section.audioUrl && (
            <div className="px-4 pt-4 md:px-6">
              {/*
                `key` là bắt buộc, không phải trang trí. Thiếu nó thì khi chuyển giữa
                hai phần CÙNG CÓ audio, React tái sử dụng instance: `src` đổi nhưng
                `allowedTimeRef` còn giữ vị trí của bản ghi trước và kéo `currentTime`
                của bản ghi mới về mốc cũ, còn `startedHere` thì bỏ qua sạch cổng
                cảnh báo của phần thứ hai.
              */}
              <AudioPlayer
                key={section.id}
                src={section.audioUrl}
                mode={section.audioPlayMode}
                sectionId={section.id}
                sectionTitle={section.title}
                onStart={onAudioStart}
              />
            </div>
          )}

          {hasPassages ? (
            // Split view: đoạn văn trái, câu hỏi phải, kéo được thanh chia
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div
                className="thin-scroll min-h-0 overflow-y-auto p-4 md:p-6"
                style={{ flexBasis: `${splitPercent}%` }}
              >
                {section.passages.map((p) => (
                  <PassageView key={p.id} passage={p} />
                ))}
              </div>

              <div
                ref={dragRef}
                onPointerDown={onDragStart}
                onKeyDown={onSplitKey}
                tabIndex={0}
                role="separator"
                aria-label="Kéo để đổi tỉ lệ chia"
                aria-orientation="vertical"
                aria-valuenow={Math.round(splitPercent)}
                aria-valuemin={25}
                aria-valuemax={75}
                className="hidden w-1.5 flex-none cursor-col-resize bg-line transition-colors hover:bg-purple focus-visible:bg-purple lg:block"
              />

              <div
                className="thin-scroll flex min-h-0 flex-col gap-4 overflow-y-auto p-4 md:p-6"
                style={{ flexBasis: `${100 - splitPercent}%` }}
              >
                {section.questions.map((q) => (
                  <QuestionView key={q.id} question={q} />
                ))}
              </div>
            </div>
          ) : (
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4 p-4 md:p-6">
                {section.questions.map((q) => (
                  <QuestionView key={q.id} question={q} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thanh điều hướng câu hỏi — cố định trên desktop */}
        <aside className="thin-scroll hidden w-[280px] min-h-0 flex-none overflow-y-auto border-l border-line bg-card p-5 xl:block">
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
            ref={navDrawerRef}
            tabIndex={-1}
            className="thin-scroll w-[300px] max-w-[85vw] overflow-y-auto bg-card p-5 outline-none"
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

      {showExit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6 backdrop-blur-sm"
          onClick={closeExit}
          role="presentation"
        >
          <div
            ref={exitDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
            className="w-full max-w-[460px] rounded-[28px] bg-card p-6 outline-none"
          >
            <h2 id="exit-title" className="text-[21px] font-bold">
              Rời phòng thi?
            </h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-muted-strong">
              Bài làm của bạn được lưu lại và có thể vào làm tiếp.
              {data.attempt.mode === 'EXAM' && (
                // Nói thẳng, vì đây là thứ quyết định họ có nên thoát hay không
                <>
                  {' '}
                  <strong>
                    Nhưng đây là chế độ thi thật: đồng hồ vẫn chạy ở server kể cả khi bạn
                    rời trang.
                  </strong>{' '}
                  Hết giờ thì bài tự động được nộp.
                </>
              )}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeExit} className="btn-ghost">
                Ở lại làm tiếp
              </button>
              <button type="button" onClick={() => void saveAndExit()} className="btn-primary">
                Lưu và thoát
              </button>
            </div>
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
