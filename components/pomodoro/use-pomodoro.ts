'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Logic của Pomodoro, tách khỏi giao diện.
 *
 * Hai điểm quyết định độ tin cậy:
 *  1. Đếm bằng MỐC KẾT THÚC tuyệt đối chứ không trừ dần mỗi tick. Tab bị ẩn sẽ
 *     bị throttle setInterval, trừ dần sẽ chạy chậm dần và sai vài phút.
 *  2. Trạng thái ghi vào localStorage, nên F5 hay chuyển trang trong app vẫn
 *     đếm tiếp đúng — đúng tinh thần "trang mở suốt lúc học".
 */

export type Phase = 'focus' | 'short' | 'long'

export const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

/**
 * Màu của từng pha đọc từ CSS variable (xem globals.css).
 * Giá trị nằm ở CSS chứ không phải ở đây — component chỉ cầm tên biến.
 */
export const PHASE_META: Record<Phase, { label: string; hint: string; ring: string; bg: string }> = {
  focus: {
    label: 'Tập trung',
    hint: 'Làm bài, không chuyển tab',
    ring: 'var(--pomo-focus-ring)',
    bg: 'var(--pomo-focus-bg)',
  },
  short: {
    label: 'Nghỉ ngắn',
    hint: 'Đứng dậy, nhìn ra xa',
    ring: 'var(--pomo-short-ring)',
    bg: 'var(--pomo-short-bg)',
  },
  long: {
    label: 'Nghỉ dài',
    hint: 'Nghỉ hẳn rồi quay lại',
    ring: 'var(--pomo-long-ring)',
    bg: 'var(--pomo-long-bg)',
  },
}

const STORAGE_KEY = 'pomodoro-v1'

type Persisted = {
  phase: Phase
  endsAt: number | null
  remainingWhenPaused: number
  completedFocus: number
}

const INITIAL: Persisted = {
  phase: 'focus',
  endsAt: null,
  remainingWhenPaused: DURATIONS.focus,
  completedFocus: 0,
}

function load(): Persisted {
  if (typeof window === 'undefined') return INITIAL
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Persisted
  } catch {
    /* bỏ qua, dùng mặc định */
  }
  return INITIAL
}

function save(state: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* hết quota — không đáng làm hỏng đồng hồ */
  }
}

/** Tiếng báo ngắn bằng WebAudio, khỏi cần file âm thanh. */
function chime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    for (const [i, freq] of [660, 880].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = now + i * 0.18
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
      osc.start(t)
      osc.stop(t + 0.18)
    }
    setTimeout(() => void ctx.close(), 800)
  } catch {
    /* trình duyệt chặn audio — im lặng là chấp nhận được */
  }
}

export function usePomodoro() {
  const [state, setState] = useState<Persisted>(INITIAL)
  const [remaining, setRemaining] = useState(DURATIONS.focus)
  const [hydrated, setHydrated] = useState(false)
  const firedRef = useRef(false)

  /**
   * Nạp trạng thái từ localStorage SAU khi mount.
   *
   * Bắt buộc phải là effect: server không đọc được localStorage nên lần render
   * đầu phải ra giá trị mặc định, đọc trong lúc render sẽ gây lệch hydrate.
   * Quy tắc set-state-in-effect không áp dụng cho trường hợp đồng bộ từ nguồn
   * dữ liệu ngoài chỉ có ở client.
   */
  useEffect(() => {
    const loaded = load()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded)
    setRemaining(
      loaded.endsAt
        ? Math.max(0, Math.round((loaded.endsAt - Date.now()) / 1000))
        : loaded.remainingWhenPaused,
    )
    setHydrated(true)
  }, [])

  const advance = useCallback(() => {
    setState((prev) => {
      // Cứ 4 lần tập trung thì nghỉ dài
      const nextCompleted = prev.phase === 'focus' ? prev.completedFocus + 1 : prev.completedFocus
      const nextPhase: Phase =
        prev.phase === 'focus' ? (nextCompleted % 4 === 0 ? 'long' : 'short') : 'focus'
      const next: Persisted = {
        phase: nextPhase,
        endsAt: null,
        remainingWhenPaused: DURATIONS[nextPhase],
        completedFocus: nextCompleted,
      }
      save(next)
      return next
    })
  }, [])

  /**
   * Đồng hồ chỉ chạy khi có mốc kết thúc. Lúc tạm dừng thì giá trị hiển thị đọc
   * thẳng từ state (xem `shownRemaining`) chứ không setState trong effect —
   * làm vậy sẽ gây cascading render.
   */
  useEffect(() => {
    if (!hydrated || !state.endsAt) return

    firedRef.current = false
    const endsAt = state.endsAt
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !firedRef.current) {
        firedRef.current = true
        chime()
        advance()
      }
    }
    // Lần đọc đầu hoãn sang tick sau để không setState đồng bộ trong thân effect
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 500)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [state.endsAt, hydrated, advance])

  const start = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, endsAt: Date.now() + prev.remainingWhenPaused * 1000 }
      save(next)
      return next
    })
  }, [])

  const pause = useCallback(() => {
    setState((prev) => {
      const left = prev.endsAt
        ? Math.max(0, Math.round((prev.endsAt - Date.now()) / 1000))
        : prev.remainingWhenPaused
      const next = { ...prev, endsAt: null, remainingWhenPaused: left }
      save(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, endsAt: null, remainingWhenPaused: DURATIONS[prev.phase] }
      save(next)
      return next
    })
  }, [])

  const switchPhase = useCallback((phase: Phase) => {
    setState((prev) => {
      const next = { ...prev, phase, endsAt: null, remainingWhenPaused: DURATIONS[phase] }
      save(next)
      return next
    })
  }, [])

  // Đang chạy thì lấy từ interval; tạm dừng thì đọc thẳng state — không cần effect
  const shownRemaining = state.endsAt !== null ? remaining : state.remainingWhenPaused
  const total = DURATIONS[state.phase]

  return {
    phase: state.phase,
    completedFocus: state.completedFocus,
    running: state.endsAt !== null,
    hydrated,
    remaining: shownRemaining,
    /** 0 → 1, dùng để vẽ vòng tiến trình */
    progress: total > 0 ? 1 - shownRemaining / total : 0,
    mm: String(Math.floor(shownRemaining / 60)).padStart(2, '0'),
    ss: String(shownRemaining % 60).padStart(2, '0'),
    start,
    pause,
    reset,
    switchPhase,
  }
}
