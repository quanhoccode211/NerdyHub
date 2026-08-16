'use client'

import { DURATIONS, PHASE_META, usePomodoro, type Phase } from './use-pomodoro'
import { useRainSound } from './rain-sound'
import { PauseIcon, PlayIcon, ResetIcon } from '../shell/icons'

/**
 * Trang Pomodoro — đồng hồ ở CHÍNH GIỮA, tối giản hết mức.
 *
 * Cố ý không có thẻ, không tiêu đề khối, không menu "…": mỗi thứ thêm vào đây
 * là một thứ để mắt bám vào trong lúc lẽ ra phải tập trung. Chỉ còn chọn pha,
 * đồng hồ, hai nút, và tiếng mưa trắng.
 */

const BOX = 300
const R = 132
const C = 2 * Math.PI * R

export function PomodoroClock() {
  const { phase, completedFocus, running, hydrated, progress, mm, ss, start, pause, reset, switchPhase } =
    usePomodoro()
  const rain = useRainSound()

  const meta = PHASE_META[phase]

  return (
    <div className="flex min-h-[calc(100vh-13rem)] flex-col items-center justify-center gap-9">
      {/* Chọn pha */}
      <div className="flex gap-1.5 rounded-pill bg-soft p-1">
        {(Object.keys(DURATIONS) as Phase[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => switchPhase(p)}
            aria-pressed={phase === p}
            className={`rounded-pill px-5 py-2 text-[14px] font-medium transition-colors ${
              phase === p ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {PHASE_META[p].label}
          </button>
        ))}
      </div>

      {/* Đồng hồ */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: BOX, height: BOX, background: meta.bg }}
      >
        <svg width={BOX} height={BOX} className="absolute -rotate-90" aria-hidden="true">
          <circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={R}
            fill="none"
            stroke="var(--pomo-track)"
            strokeWidth="10"
          />
          <circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={R}
            fill="none"
            stroke={meta.ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div
          className="relative text-[65px] leading-none font-bold tabular-nums text-on-tone"
          role="timer"
          aria-live="off"
        >
          {hydrated ? `${mm}:${ss}` : '--:--'}
        </div>
      </div>

      <p className="text-[15px] text-muted">{meta.hint}</p>

      {/* Điều khiển */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={running ? pause : start} className="btn-primary px-9">
          {running ? (
            <>
              <PauseIcon size={14} /> Tạm dừng
            </>
          ) : (
            <>
              <PlayIcon size={14} /> Bắt đầu
            </>
          )}
        </button>
        <button type="button" onClick={reset} className="icon-circle h-[46px] w-[46px]" aria-label="Đặt lại">
          <ResetIcon size={17} />
        </button>
      </div>

      {/* Tiếng mưa trắng — sinh bằng WebAudio, không cần file */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={rain.toggle}
          aria-pressed={rain.on}
          title="Rain Sound — boons_freak (Pixabay) — thay file tại public/audio/rain-loop.mp3 nếu muốn bản khác"
          className={`flex items-center gap-2 rounded-pill border px-4 py-2 text-[13.5px] font-medium transition-colors ${
            rain.on
              ? 'border-good bg-good-soft text-good'
              : 'border-line text-muted hover:text-ink'
          }`}
        >
          🌧️ {rain.on ? 'Đang mưa' : 'Tiếng mưa'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={rain.volume}
          onChange={(e) => rain.setVolume(Number(e.target.value))}
          disabled={!rain.on}
          aria-label="Âm lượng tiếng mưa"
          className="w-28 accent-purple disabled:opacity-40"
        />
      </div>

      {completedFocus > 0 && (
        <p className="text-[13.5px] text-muted">Đã xong {completedFocus} phiên tập trung hôm nay</p>
      )}
    </div>
  )
}
