'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClockIcon } from '../shell/icons'
import { formatClock } from '@/lib/format'

/**
 * Timer phiên chơi — cố định góc phải dưới màn hình. Dùng chung cho các game
 * trong Tiện ích (More or Less, Wordle…).
 *
 * Chỉ đếm từ lúc người chơi bắt đầu (prop startedAtMs do game tự quyết),
 * đếm lên liên tục qua các ván. Đủ 5 phút: nhắc nhẹ đúng một lần.
 */

/** Đã chơi 5 phút — nhắc nhẹ quay lại bài học */
const NUDGE_SEC = 5 * 60

export function PlayTimer({ startedAtMs }: { startedAtMs: number | null }) {
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (startedAtMs === null) return
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [startedAtMs])

  if (startedAtMs === null) return null
  const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000))
  const over = elapsed >= NUDGE_SEC
  const showNudge = over && !dismissed

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {showNudge && (
        <div
          role="alert"
          className="pop-in flex w-[280px] flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-lg"
        >
          <p className="text-[14.5px] leading-relaxed text-muted-strong">
            Đã chơi <strong>5 phút</strong> rồi — nhắc nhẹ: quay lại bài học thôi nào! 📚
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard" className="btn-primary px-3 py-1.5 text-[13.5px]">
              Về bài học
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="btn-ghost px-3 py-1.5 text-[13.5px]"
            >
              Chơi thêm chút
            </button>
          </div>
        </div>
      )}
      <div
        className={`flex items-center gap-2 rounded-pill border px-3.5 py-2 font-sans text-[14px] font-semibold tabular-nums shadow ${
          over ? 'border-amber bg-amber-soft text-amber' : 'border-line bg-card text-muted-strong'
        }`}
        aria-label="Thời gian đã chơi"
      >
        <ClockIcon size={15} />
        {formatClock(elapsed)}
      </div>
    </div>
  )
}
