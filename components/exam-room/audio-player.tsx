'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock } from '@/lib/format'
import type { AudioPlayMode } from '@/lib/enums'
import { LockIcon, PlayIcon, WarningIcon } from '../shell/icons'
import { useExamStore } from './store'

/**
 * Trình phát audio cho phần Nghe (SPEC F2.3).
 *
 * ONCE_NO_SEEK — mô phỏng thi thật:
 *   • phát đúng MỘT lần, hết là thôi — kể cả sau khi tải lại trang
 *   • KHÔNG có thanh tua; mọi thao tác seek bị hoàn tác ở tầng sự kiện,
 *     nên bấm phím tắt hay gọi từ console cũng không tua được
 *   • preload trước, hiện trạng thái tải — không để thí sinh mất thời gian
 *     thi vì buffering
 *
 * "ĐÃ PHÁT" LÀ TRẠNG THÁI CỦA SERVER, không phải của component. Khi nó còn là
 * `useState` ở đây thì F5 dựng lại component từ đầu và nút "Bắt đầu nghe" hiện
 * lại — nghe bao nhiêu lần cũng được, đúng thứ chế độ thi thật hứa là không thể.
 *
 * FREE — chế độ luyện tập: tua, tua lại, chỉnh tốc độ 0.75×–1.5×.
 */
export function AudioPlayer({
  src,
  mode,
  sectionId,
  sectionTitle,
  onStart,
}: {
  src: string
  mode: AudioPlayMode
  sectionId: string
  sectionTitle: string
  /** Đẩy mốc "đã phát" lên server NGAY, không chờ debounce 3 giây */
  onStart: (sectionId: string) => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [ready, setReady] = useState(false)
  const started = useExamStore((s) => s.audioPlayedSections.has(sectionId))
  const [ended, setEnded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)
  const [error, setError] = useState(false)

  const strict = mode === 'ONCE_NO_SEEK'
  // Mốc thời gian hợp lệ cuối cùng — dùng để hoàn tác mọi lần seek ở chế độ strict
  const allowedTimeRef = useRef(0)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onLoaded = () => {
      setReady(true)
      setDuration(el.duration || 0)
    }
    const onTime = () => {
      if (strict) {
        // Chỉ cho tiến về phía trước theo nhịp phát tự nhiên
        if (el.currentTime > allowedTimeRef.current) allowedTimeRef.current = el.currentTime
      }
      setCurrent(el.currentTime)
    }
    const onSeeking = () => {
      if (!strict) return
      // Ai đó cố tua -> kéo về đúng vị trí đang phát
      if (Math.abs(el.currentTime - allowedTimeRef.current) > 0.5) {
        el.currentTime = allowedTimeRef.current
      }
    }
    const onEnded = () => {
      setEnded(true)
      setPlaying(false)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onError = () => setError(true)

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('canplaythrough', onLoaded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('seeking', onSeeking)
    el.addEventListener('ended', onEnded)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('error', onError)

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('canplaythrough', onLoaded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('seeking', onSeeking)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('error', onError)
    }
  }, [strict])

  /*
    Đã phát trong LẦN MỞ TRANG NÀY hay chưa — khác với `started` của server.

    Hai giá trị này tách nhau ở đúng tình huống cần chặn: `started` là true (server
    nhớ) nhưng `startedHere` là false (vừa F5). Khi đó không được dựng lại trình phát
    cho họ bấm tiếp — phải khoá hẳn. Gộp hai khái niệm vào một cờ là mất luôn khả
    năng phân biệt "đang nghe" với "đã nghe xong từ lần trước".
  */
  const [startedHere, setStartedHere] = useState(false)
  const lockedOut = strict && started && !startedHere

  const start = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    /*
      Ghi mốc TRƯỚC khi phát, và đẩy lên server ngay thay vì chờ debounce 3 giây.
      Cửa sổ 3 giây đó chính là thứ bị lợi dụng: nghe vài giây rồi F5 thật nhanh,
      server chưa kịp biết gì.
    */
    setStartedHere(true)
    onStart(sectionId)
    void el.play().catch(() => setError(true))
  }, [onStart, sectionId])

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => setError(true))
    else el.pause()
  }, [])

  const seek = useCallback(
    (value: number) => {
      if (strict) return
      const el = audioRef.current
      if (!el) return
      el.currentTime = value
    },
    [strict],
  )

  const changeRate = useCallback((r: number) => {
    const el = audioRef.current
    if (!el) return
    el.playbackRate = r
    setRate(r)
  }, [])

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className="rounded-card bg-purple-soft p-5">
      {/* preload="auto": tải sẵn trước khi thí sinh bấm bắt đầu */}
      <audio ref={audioRef} src={src} preload="auto" className="hidden">
        <track kind="captions" />
      </audio>

      {error ? (
        <p className="flex items-center gap-2 text-[15px] font-medium text-red">
          <WarningIcon size={18} />
          Không tải được audio. Hãy kiểm tra kết nối rồi tải lại trang.
        </p>
      ) : lockedOut ? (
        // Server nhớ phần này đã phát. Tải lại trang không đưa nút bắt đầu quay lại.
        <div className="text-center">
          <p className="flex items-center justify-center gap-2 text-[16px] font-semibold text-muted-strong">
            <LockIcon size={18} />
            Bạn đã nghe phần này.
          </p>
          <p className="mt-1.5 text-[14.5px] text-muted">
            Audio chỉ phát một lần, giống thi thật — kể cả khi tải lại trang. Bạn tiếp tục
            trả lời các câu hỏi bên dưới nhé.
          </p>
        </div>
      ) : !started && strict ? (
        // Cảnh báo trước khi phát — SPEC F2.3
        <div className="text-center">
          <p className="flex items-center justify-center gap-2 text-[16px] font-semibold text-purple">
            <LockIcon size={18} />
            Audio chỉ phát một lần, giống thi thật.
          </p>
          <p className="mt-1.5 text-[14.5px] text-muted-strong">
            Không tua và không nghe lại được. Hãy chuẩn bị sẵn sàng trước khi bắt đầu.
          </p>
          <button
            type="button"
            onClick={start}
            disabled={!ready}
            className="btn-primary mx-auto mt-4 disabled:opacity-60"
          >
            <PlayIcon size={15} />
            {ready ? `Bắt đầu nghe — ${sectionTitle}` : 'Đang tải audio…'}
          </button>
          {!ready && (
            <p className="mt-2 text-[13.5px] text-muted">Đang tải sẵn để không gián đoạn khi thi.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {!strict && (
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-purple text-white"
                aria-label={playing ? 'Tạm dừng' : 'Phát'}
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1.5" />
                    <rect x="14" y="4" width="4" height="16" rx="1.5" />
                  </svg>
                ) : (
                  <PlayIcon size={15} />
                )}
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[13.5px] font-medium text-purple">
                <span>{strict ? 'Đang phát — không tua được' : sectionTitle}</span>
                <span className="tabular-nums">
                  {formatClock(current)} / {formatClock(duration)}
                </span>
              </div>

              {strict ? (
                // Thanh tiến trình thuần hiển thị: không phải input, không kéo được
                <div className="mt-2 h-2 overflow-hidden rounded-pill bg-white/70" aria-hidden="true">
                  <div
                    className="h-full rounded-pill bg-purple transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : (
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={current}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="mt-2 w-full accent-purple"
                  aria-label="Tua audio"
                />
              )}
            </div>
          </div>

          {!strict && (
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] text-muted-strong">Tốc độ</span>
              {[0.75, 1, 1.25, 1.5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => changeRate(r)}
                  className={`rounded-pill px-2.5 py-1 text-[13.5px] font-medium ${
                    rate === r ? 'bg-purple text-white' : 'bg-white text-muted-strong hover:bg-white/70'
                  }`}
                >
                  {r}×
                </button>
              ))}
            </div>
          )}

          {ended && strict && (
            <p className="text-[14px] font-medium text-muted-strong">
              Đã phát xong. Bạn tiếp tục trả lời các câu hỏi bên dưới.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
