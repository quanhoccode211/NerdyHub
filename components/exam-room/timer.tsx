'use client'

import { useEffect, useState } from 'react'
import { formatClock } from '@/lib/format'
import { ClockIcon, WarningIcon } from '../shell/icons'
import { useExamStore } from './store'

/**
 * Đồng hồ phòng thi (SPEC F2.2).
 *
 * Thời gian là của SERVER: mốc `remainingAtRef` do server cấp, client chỉ đếm
 * bằng `performance.now()` — đồng hồ đơn điệu, đổi giờ hệ thống không ảnh hưởng.
 * Mỗi lần sync thành công, mốc được đặt lại theo server.
 */
export function Timer({ attemptId, onExpire }: { attemptId: string; onExpire: () => void }) {
  const mode = useExamStore((s) => s.mode)
  const readClock = useExamStore((s) => s.readClock)
  const submitted = useExamStore((s) => s.submitted)
  const hydrated = useExamStore((s) => s.hydrated)
  const storeAttemptId = useExamStore((s) => s.attemptId)

  const [value, setValue] = useState(0)

  /**
   * Store là singleton cấp module nên nó SỐNG SÓT qua điều hướng client-side:
   * ở lần render đầu của một attempt mới, store vẫn giữ monotonicRef của attempt
   * trước — readClock() sẽ ra 0 và nộp bài trắng. Vì vậy phải khoá theo attemptId,
   * không chỉ theo cờ hydrated.
   */
  const ready = hydrated && storeAttemptId === attemptId

  useEffect(() => {
    if (!ready) return

    const tick = () => {
      const v = readClock()
      setValue(v)
      /*
        Bắn theo TRẠNG THÁI, cố ý không dùng cờ "đã bắn một lần".

        Cờ đó từng khiến một lần tự nộp hỏng vì nghẽn mạng khoá luôn cơ chế tự
        nộp: nó đã cháy vĩnh viễn nên không ai gọi lại, thí sinh ngồi ở 00:00 và
        vẫn trả lời tiếp. Chống gọi chồng nằm ở ExamRoom, nơi biết được lần nộp
        trước đã xong hay chưa; `submitted` cũng tự dừng nhánh này khi xong.
      */
      if (mode === 'EXAM' && v <= 0 && !submitted) onExpire()
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [readClock, mode, onExpire, submitted, ready])

  const isPractice = mode === 'PRACTICE'
  const warning = ready && !isPractice && value <= 300 && value > 60
  const critical = ready && !isPractice && value <= 60

  return (
    <div
      role="timer"
      aria-live={critical ? 'assertive' : 'off'}
      aria-label={isPractice ? 'Thời gian đã làm' : 'Thời gian còn lại'}
      className={`flex items-center gap-2.5 rounded-pill px-4 py-2.5 font-semibold tabular-nums transition-colors ${
        critical
          ? 'bg-red text-white'
          : warning
            ? 'bg-amber-soft text-amber'
            : 'bg-purple-soft text-purple'
      }`}
    >
      {critical ? <WarningIcon size={18} /> : <ClockIcon size={18} />}
      <span className="text-[18px]">{ready ? formatClock(value) : '--:--'}</span>
      {isPractice && <span className="text-[13px] font-medium opacity-70">luyện tập</span>}
    </div>
  )
}

/** Dải cảnh báo nổi bật ở mốc 5 phút và 1 phút. */
export function TimeWarningBanner() {
  const mode = useExamStore((s) => s.mode)
  const readClock = useExamStore((s) => s.readClock)
  const hydrated = useExamStore((s) => s.hydrated)
  const [remaining, setRemaining] = useState(Number.POSITIVE_INFINITY)
  const [dismissed, setDismissed] = useState<{ five: boolean; one: boolean }>({
    five: false,
    one: false,
  })

  useEffect(() => {
    if (mode === 'PRACTICE' || !hydrated) return
    // Lần đọc đầu hoãn sang tick sau: setState đồng bộ ngay trong thân effect
    // gây cascading render.
    const first = setTimeout(() => setRemaining(readClock()), 0)
    const id = setInterval(() => setRemaining(readClock()), 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [readClock, mode, hydrated])

  if (mode === 'PRACTICE' || !hydrated) return null

  const showOne = remaining <= 60 && remaining > 0 && !dismissed.one
  const showFive = !showOne && remaining <= 300 && remaining > 60 && !dismissed.five
  if (!showOne && !showFive) return null

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-4 px-5 py-3 text-[15.5px] font-medium ${
        showOne ? 'bg-red text-white' : 'bg-amber-soft text-amber'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <WarningIcon size={18} />
        {showOne
          ? 'Còn 1 phút! Bài sẽ tự động nộp khi hết giờ.'
          : 'Còn 5 phút. Hãy kiểm tra lại các câu chưa làm.'}
      </span>
      <button
        type="button"
        onClick={() => setDismissed((d) => (showOne ? { ...d, one: true } : { ...d, five: true }))}
        className="rounded-pill px-3 py-1 text-[14px] underline-offset-2 hover:underline"
      >
        Ẩn
      </button>
    </div>
  )
}
