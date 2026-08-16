'use client'

import { useCallback, useEffect, useRef } from 'react'
import { requeue, useExamStore } from './store'

const DEBOUNCE_MS = 3000 // SPEC F2.5: debounce 3 giây
const RETRY_BASE_MS = 1_000
const RETRY_MAX_MS = 30_000 // trần backoff: mất mạng lâu vẫn phải ngóng lại đều đặn
const RETRY_AFTER_MAX_MS = 120_000 // không tin một con số vô lý từ header
const PRACTICE_HEARTBEAT_MS = 60_000
const KEEPALIVE_MAX_BYTES = 60_000 // trần keepalive của trình duyệt là 64KB

/** Lỗi mà thử lại cũng vô ích — dừng hẳn thay vì quay vòng. */
const TERMINAL_STATUS = new Set([400, 403, 404, 409])

export type SyncGoneReason = 'not_in_progress' | 'forbidden' | 'not_found' | 'invalid_payload'

type SyncCallbacks = {
  /** Server báo đã quá `expiresAt` — tin server, không tin đồng hồ client. */
  onExpired?: () => void
  /** Lỗi vĩnh viễn: phòng thi không còn ghi được gì lên server nữa. */
  onGone?: (reason: SyncGoneReason) => void
}

type Outcome =
  | { kind: 'idle' }
  | { kind: 'ok' }
  | { kind: 'retry'; delayMs: number }
  | { kind: 'gone'; reason: SyncGoneReason }

function reasonFor(status: number, code: string | null): SyncGoneReason {
  if (status === 409) return 'not_in_progress'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  return (code as SyncGoneReason) ?? 'invalid_payload'
}

/** `Retry-After` hợp lệ ở cả hai dạng: số giây, hoặc HTTP-date. */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const clamp = (ms: number) => Math.min(RETRY_AFTER_MAX_MS, Math.max(0, ms))
  const secs = Number(header)
  if (Number.isFinite(secs)) return clamp(secs * 1000)
  const at = Date.parse(header)
  if (!Number.isNaN(at)) return clamp(at - Date.now())
  return null
}

/**
 * Jitter là bắt buộc, không phải trang trí: mất mạng thường xảy ra với cả phòng
 * thi cùng lúc, thử lại đồng pha sẽ dội vào server thành từng đợt.
 */
function backoffDelay(failures: number) {
  const exp = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** failures)
  return Math.round(exp * (0.5 + Math.random() * 0.5))
}

/**
 * Lớp 2 của chống mất bài: gom thay đổi và POST batch.
 *
 * BA NGUỒN KÍCH HOẠT TÁCH BẠCH — đây là điểm khác cốt lõi so với bản cũ:
 *   • debounce — chỉ phản ứng với thay đổi THẬT của người dùng (`dirtyVersion`)
 *   • backoff  — độc quyền lo việc thử lại sau lỗi
 *   • pump     — nối tiếp và GỘP các lệnh flush chồng nhau
 *
 * Bản cũ trộn cả ba vào một subscription: `requeue()` sau lỗi làm số pending đổi
 * → subscription lại hẹn 3 giây → gửi lại → cùng một lỗi, quay vòng vô hạn. Ở
 * đây `requeue` không chạm `dirtyVersion` nên nó không thể tự kích hoạt lần gửi
 * tiếp theo; mọi lần thử lại đều phải đi qua backoff.
 */
export function useSync(attemptId: string, enabled: boolean, callbacks: SyncCallbacks = {}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pumpRef = useRef<Promise<void> | null>(null)
  const rerunRef = useRef(false)
  const failuresRef = useRef(0)
  const stoppedRef = useRef(false)

  const cbRef = useRef(callbacks)
  useEffect(() => {
    cbRef.current = callbacks
  })

  /*
    flush tự hẹn lại chính nó qua ref. Nếu để `scheduleRetry` phụ thuộc trực tiếp
    vào `flush`, hai useCallback sẽ tham chiếu vòng và mọi effect bên dưới bị
    dựng lại sau mỗi lần render.
  */
  const flushRef = useRef<(o?: { keepalive?: boolean; force?: boolean }) => Promise<void>>(
    async () => {},
  )

  const clearTimers = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }
  }, [])

  const scheduleRetry = useCallback((delayMs: number) => {
    if (retryRef.current) clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      retryRef.current = null
      void flushRef.current()
    }, delayMs)
  }, [])

  const sendOnce = useCallback(
    async (keepalive: boolean, force: boolean): Promise<Outcome> => {
      const store = useExamStore.getState()
      // Bài đã nộp / phòng đã khoá: gửi thêm chỉ tạo ra ghi đè lên bài đã chấm
      if (store.submitted || store.locked) return { kind: 'idle' }

      const pending =
        store.dirtyAnswers.size + store.dirtyAnnotations.size + store.deletedAnnotations.size
      if (pending === 0 && !force) return { kind: 'idle' }

      const batch = store.takeDirtyBatch()
      store.markSyncing()

      const payload = {
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
          // Xoá chỉ cần id — schema có biến thể riêng, không phải bịa targetId giả
          ...batch.deleted.map((id) => ({ id, deleted: true as const })),
        ],
        currentSectionId: store.currentSectionId || null,
        /*
          PRACTICE đếm giờ ở client và chỉ có sync mới ghi được xuống DB. Bản cũ
          không bao giờ gửi trường này dù schema và route đều đã hỗ trợ, nên đồng
          hồ luyện tập về 0 sau mỗi lần tải lại trang.
        */
        timeSpent: store.mode === 'PRACTICE' ? store.readClock() : undefined,
      }

      const body = JSON.stringify(payload)

      try {
        const res = await fetch(`/api/attempts/${attemptId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          // Quá 64KB thì trình duyệt từ chối keepalive IM LẶNG — thà gửi thường
          keepalive: keepalive && body.length <= KEEPALIVE_MAX_BYTES,
        })

        if (res.ok) {
          const data = (await res.json().catch(() => null)) as {
            remainingSeconds?: number
            expired?: boolean
          } | null
          useExamStore
            .getState()
            .markSynced(typeof data?.remainingSeconds === 'number' ? data.remainingSeconds : null)
          if (data?.expired) cbRef.current.onExpired?.()
          return { kind: 'ok' }
        }

        /*
          Dữ liệu luôn quay về hàng đợi TRƯỚC khi phân loại lỗi — kể cả lỗi vĩnh
          viễn, để lệnh nộp còn gom được nốt vào batch cuối.
        */
        requeue(batch)

        if (TERMINAL_STATUS.has(res.status)) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          const reason = reasonFor(res.status, data?.error ?? null)
          useExamStore.getState().markFailed('terminal', reason)
          return { kind: 'gone', reason }
        }

        if (res.status === 429) {
          // Server đã nói rõ phải chờ bao lâu; chỉ đoán bằng backoff khi nó im lặng
          const wait =
            parseRetryAfter(res.headers.get('Retry-After')) ?? backoffDelay(failuresRef.current)
          useExamStore.getState().markFailed('retrying')
          return { kind: 'retry', delayMs: wait }
        }

        useExamStore.getState().markFailed('retrying')
        return { kind: 'retry', delayMs: backoffDelay(failuresRef.current) }
      } catch {
        // Mất mạng: giữ nguyên toàn bộ, sự kiện `online` sẽ rút ngắn chờ đợi
        requeue(batch)
        useExamStore.getState().markFailed('offline')
        return { kind: 'retry', delayMs: backoffDelay(failuresRef.current) }
      }
    },
    [attemptId],
  )

  const flush = useCallback(
    async (opts: { keepalive?: boolean; force?: boolean } = {}) => {
      if (!enabled || stoppedRef.current) return

      if (pumpRef.current) {
        /*
          Có request đang bay thì GHI NHẬN yêu cầu rồi chờ, tuyệt đối không return
          trắng: bản cũ thoát ở đây và không còn ai hẹn lại lần gửi nào, nên một
          thay đổi tạo ra đúng lúc đó nằm im vô thời hạn. Await cũng chính là thứ
          làm `stop()` trước khi nộp bài trở nên đáng tin.
        */
        rerunRef.current = true
        await pumpRef.current
        return
      }

      const run = (async () => {
        for (;;) {
          rerunRef.current = false
          const outcome = await sendOnce(opts.keepalive ?? false, opts.force ?? false)

          if (outcome.kind === 'gone') {
            stoppedRef.current = true
            clearTimers()
            cbRef.current.onGone?.(outcome.reason)
            return
          }
          if (outcome.kind === 'retry') {
            failuresRef.current += 1
            scheduleRetry(outcome.delayMs)
            return
          }
          if (outcome.kind === 'ok') {
            failuresRef.current = 0 // thành công là xoá sạch lịch sử backoff
            if (retryRef.current) {
              clearTimeout(retryRef.current)
              retryRef.current = null
            }
          }
          if (!rerunRef.current || stoppedRef.current) return
        }
      })()

      pumpRef.current = run
      try {
        await run
      } finally {
        pumpRef.current = null
      }
    },
    [enabled, sendOnce, scheduleRetry, clearTimers],
  )

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  /**
   * Dừng hẳn engine rồi CHỜ request đang bay settle.
   *
   * Bắt buộc gọi trước khi nộp bài: nếu request đang bay hỏng sau khi lệnh nộp
   * đã gom batch cuối, `requeue()` đẩy đáp án vào một store đã submitted và
   * chúng không bao giờ được gửi nữa, trong khi bài thì đã chấm xong.
   */
  const stop = useCallback(async () => {
    stoppedRef.current = true
    clearTimers()
    await pumpRef.current
  }, [clearTimers])

  /** Nộp thủ công thất bại -> autosave phải chạy tiếp trong lúc chờ người dùng thử lại. */
  const resume = useCallback(() => {
    stoppedRef.current = false
    failuresRef.current = 0
  }, [])

  // Debounce: chỉ thay đổi THẬT của người dùng mới đẩy lịch gửi lùi 3 giây
  useEffect(() => {
    if (!enabled) return
    const unsub = useExamStore.subscribe((state, prev) => {
      // Bám vào bộ đếm phiên bản, không phải số lượng pending — xem ghi chú ở
      // `dirtyVersion` trong store.ts.
      if (state.dirtyVersion === prev.dirtyVersion) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void flushRef.current()
      }, DEBOUNCE_MS)
    })
    return () => {
      unsub()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [enabled])

  // Vào phòng mà hàng đợi đã có sẵn (lớp 3 khôi phục từ sessionStorage): phải tự
  // gửi ngay, vì không có thay đổi mới nào để kích hoạt debounce.
  useEffect(() => {
    if (!enabled) return
    const id = setTimeout(() => {
      const s = useExamStore.getState()
      if (s.dirtyAnswers.size + s.dirtyAnnotations.size + s.deletedAnnotations.size > 0) {
        void flushRef.current()
      }
    }, 0)
    return () => clearTimeout(id)
  }, [enabled])

  // Có mạng lại -> xoá backoff và gửi ngay, đừng bắt người dùng chờ nốt 30 giây
  useEffect(() => {
    if (!enabled) return
    const onOnline = () => {
      failuresRef.current = 0
      if (retryRef.current) {
        clearTimeout(retryRef.current)
        retryRef.current = null
      }
      void flushRef.current()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [enabled])

  // Tab bị ẩn -> tranh thủ gửi (người dùng hay đóng máy ngay sau đó)
  useEffect(() => {
    if (!enabled) return
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void flushRef.current({ keepalive: true })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [enabled])

  // PRACTICE: nhịp tim để `timeSpent` xuống DB cả khi thí sinh chỉ ngồi đọc, không bấm gì
  useEffect(() => {
    if (!enabled || useExamStore.getState().mode !== 'PRACTICE') return
    const id = setInterval(() => void flushRef.current({ force: true }), PRACTICE_HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [enabled])

  // Chặn rời trang khi còn thay đổi chưa đồng bộ (SPEC F2.5)
  useEffect(() => {
    if (!enabled) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useExamStore.getState().hasPending()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [enabled])

  useEffect(() => clearTimers, [clearTimers])

  return { flush, stop, resume }
}
