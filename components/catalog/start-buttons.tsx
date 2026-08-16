'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ClockIcon, PlayIcon } from '../shell/icons'

/**
 * Hai lối vào của SPEC F1: Thi thật (bấm giờ, audio không tua) và Luyện tập (tự do).
 * Tạo attempt ở server rồi điều hướng vào phòng thi.
 */
export function StartButtons({ paperId, compact = false }: { paperId: string; compact?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyMode, setBusyMode] = useState<'EXAM' | 'PRACTICE' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function start(mode: 'EXAM' | 'PRACTICE') {
    setBusyMode(mode)
    setError(null)
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, mode }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Không tạo được lượt làm bài')
      }
      const data = (await res.json()) as { attemptId: string }
      startTransition(() => router.push(`/thi/${data.attemptId}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã có lỗi xảy ra')
      setBusyMode(null)
    }
  }

  const disabled = busyMode !== null || pending

  return (
    <div className="flex flex-col gap-2">
      <div className={compact ? 'flex gap-2' : 'flex flex-col gap-3 sm:flex-row'}>
        <button
          type="button"
          onClick={() => start('EXAM')}
          disabled={disabled}
          className="btn-primary disabled:opacity-60"
        >
          <PlayIcon size={15} />
          {busyMode === 'EXAM' ? 'Đang mở phòng thi…' : 'Thi thật'}
        </button>
        <button
          type="button"
          onClick={() => start('PRACTICE')}
          disabled={disabled}
          className="btn-secondary disabled:opacity-60"
        >
          <ClockIcon size={17} />
          {busyMode === 'PRACTICE' ? 'Đang mở…' : 'Luyện tập'}
        </button>
      </div>
      {!compact && (
        <p className="text-[14px] text-muted">
          <strong className="font-medium text-muted-strong">Thi thật</strong>: bấm giờ, audio phát một lần,
          tự nộp khi hết giờ. <strong className="font-medium text-muted-strong">Luyện tập</strong>: đếm giờ
          lên, tua audio thoải mái.
        </p>
      )}
      {error && <p className="text-[14px] font-medium text-red">{error}</p>}
    </div>
  )
}
