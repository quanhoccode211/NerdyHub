'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, XIcon, ResetIcon, CrownIcon } from '@/components/shell/icons'
import {
  type Item,
  type Pool,
  POOLS,
  fmtFull,
} from './more-or-less-data'
import { PlayTimer } from './play-timer'
import { sfxWin, sfxLose } from './game-sfx'
// Sinh bởi `npm run make:game-img` — URL CDN + credit nguồn ảnh
import imageManifest from './image-manifest.json'

/** Tra ảnh minh họa theo "<tên category>|<text item>" */
const IMAGES = imageManifest as unknown as Record<
  string,
  { src: string; source: string; credit: string }
>

function imgFor(pool: Pool, text: string): string | undefined {
  return IMAGES[`${pool.category.name}|${text}`]?.src
}

/* ─── Constants ─── */
const QUESTIONS_PER_TURN = 5
/** Key riêng chế độ chuỗi — điểm cao cũ (thang 10) không dùng lại được */
const HIGH_KEY = 'ml_chain_high'
const FEEDBACK_OK_MS = 1_600
/** Sai được nhìn đáp án đúng lâu hơn một chút trước khi tự chuyển câu */
const FEEDBACK_WRONG_MS = 2_400
/** Thời gian đếm số — ngắn hơn feedback để số xong trước khi sang câu */
const COUNTUP_MS = 1_100

type Phase = 'idle' | 'reveal' | 'feedback-correct' | 'feedback-wrong' | 'done'

/* ─── Shuffle + pick helpers ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Một lượt chơi: pool duy nhất + dãy item liền mạch. */
type Turn = {
  pool: Pool
  /** items[0] mở màn làm mốc; items[1..5] là 5 câu ẩn lần lượt */
  items: Item[]
}

function pickTurn(): Turn {
  const pool = shuffle(POOLS)[0]
  // Loại giá trị trùng trước khi chọn: hai giá trị bằng nhau đứng cạnh nhau
  // trong chuỗi sẽ khiến MORE/LESS đều sai.
  const seen = new Set<number>()
  const distinct = shuffle(pool.items).filter((it) => {
    if (seen.has(it.value)) return false
    seen.add(it.value)
    return true
  })
  return { pool, items: distinct.slice(0, QUESTIONS_PER_TURN + 1) }
}

/* ─── High score persistence ─── */
function loadHigh(): number {
  if (typeof window === 'undefined') return 0
  return Number(localStorage.getItem(HIGH_KEY) ?? '0')
}
function saveHigh(n: number) {
  try { localStorage.setItem(HIGH_KEY, String(n)) } catch { /* ignore */ }
}

/* ─── Count-up: số chạy dần từ 1 lên giá trị cuối ─── */
function useCountUp(target: number, active: boolean, durationMs = COUNTUP_MS): number {
  // Bắt đầu từ 1 với mục tiêu dương — "chạy từ 1 đến số đó" —
  // mục tiêu lẻ (0,12) hoặc âm thì xuất phát từ 0 cho tự nhiên.
  const from = target >= 1 ? 1 : 0
  // null = chưa tick khung nào; mọi setState chỉ nằm TRONG callback rAF
  const [value, setValue] = useState<number | null>(null)

  useEffect(() => {
    if (!active || typeof window === 'undefined') return
    // Giảm chuyển động: duration 0 → khung đầu tiên đã là kết quả cuối
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : durationMs
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = duration <= 0 ? 1 : Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - p) ** 3 // easeOutCubic — chạy nhanh rồi chậm dần
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // from là hệ số của target nên không cần vào deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, active, durationMs])

  // Chưa tick mà đã active → giá trị xuất phát; không active → thẳng target
  return value ?? (active ? from : target)
}

/* ─── Progress bar ─── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-soft overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="flex-none font-sans text-[13px] text-muted tabular-nums">
        {current}/{total}
      </span>
    </div>
  )
}

/* ─── Slot định vị thẻ — nền tảng cho animation đổi slot ───
   Định vị bằng transform (không dùng left/right) để chuyển slot là một
   transition mượt. Key ngoài theo ITEM nên khi thẻ đổi vai (phải → trái)
   React GIỮ NGUYÊN DOM node: con số đã đếm không chạy lại. */
function CardSlot({ role, children }: { role: 'left' | 'right' | 'exit'; children: ReactNode }) {
  // Thẻ mới mount ở vị trí xa bên phải; frame kế kéo về đúng chỗ ->
  // transition đóng vai animation vào cửa
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const base =
    'absolute top-0 left-0 h-full w-[calc(50%-6px)] transition-all duration-500 ease-in-out md:w-[calc(50%-12px)]'
  const pos =
    role === 'left'
      ? 'z-10 translate-x-0'
      : role === 'right'
        ? entered
          ? 'z-10 translate-x-[calc(100%_+_12px)] opacity-100 md:translate-x-[calc(100%_+_24px)]'
          : 'z-10 translate-x-[160%] opacity-0'
        : 'pointer-events-none z-0 -translate-x-1/3 scale-95 opacity-0'

  return <div className={`${base} ${pos}`}>{children}</div>
}

/* ─── Value card (1 trong 2 bên) ─── */
function ValueCard({
  text,
  value,
  unit,
  imgSrc,
  hidden,
  revealed,
  isHigher,
  isCorrect,
}: {
  text: string
  value: number
  unit: string
  /** Ảnh minh họa (URL CDN) — optional, thiếu thì thẻ chỉ có chữ */
  imgSrc?: string
  hidden: boolean
  revealed: boolean
  /** undefined khi chưa feedback */
  isHigher?: boolean
  isCorrect?: boolean
}) {
  const showValue = !hidden || revealed
  const plain = !unit
  // Ảnh CDN có thể chết/hotlink bị chặn — onError thì thu về layout chữ
  const [imgOk, setImgOk] = useState(true)
  // Số lẻ cố định theo GIÁ TRỊ CUỐI để các khung giữa không nhảy loạn
  const decimals = (String(value).split('.')[1] ?? '').length
  const display = useCountUp(value, showValue)

  // Cỡ chữ co theo độ dài số đầy đủ — bản rộng cho layout to gấp đôi
  const finalLen = fmtFull(value, plain).length
  const sizeClass =
    finalLen >= 10
      ? 'text-[22px] md:text-[44px]'
      : finalLen >= 8
        ? 'text-[26px] md:text-[52px]'
        : 'text-[30px] md:text-[60px]'

  return (
    <div
      className={[
        'flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 p-5 transition-colors duration-300 md:gap-4 md:p-10',
        hidden && !revealed && 'border-dashed border-line-strong bg-soft',
        hidden && revealed && isCorrect === true && 'border-good bg-good-soft',
        hidden && revealed && isCorrect === false && 'border-bad bg-bad-soft',
        !hidden && 'border-line bg-card',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Ảnh minh họa — hiện cả trên thẻ ẩn, chỉ con số là bị giấu */}
      {imgSrc && imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
          className="h-28 w-full max-w-[240px] rounded-xl object-cover md:h-56 md:max-w-[380px]"
        />
      )}

      <span className="text-center text-[15px] font-semibold leading-snug text-muted-strong md:text-[18px]">
        {text}
      </span>

      {showValue ? (
        <span className={`font-sans font-bold leading-none tabular-nums ${sizeClass}`}>
          {fmtFull(display, plain, decimals)}
          {unit && <span className="ml-2 text-[14px] font-medium text-muted-strong md:text-[16px]">{unit}</span>}
        </span>
      ) : (
        <span className="font-sans text-[38px] font-bold leading-none text-muted tabular-nums md:text-[64px]">
          ???
        </span>
      )}

      {/* Indicator khi reveal — chỉ thẻ ẩn mới có */}
      {hidden && revealed && isHigher !== undefined && (
        <span
          className={[
            'mt-1 rounded-full px-2 py-0.5 font-sans text-[12px] font-semibold',
            isCorrect ? 'bg-card text-good' : 'bg-card text-bad',
          ].join(' ')}
        >
          {isHigher ? '↑ HƠN' : '↓ THẤP'}
        </span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — chế độ chuỗi: 5 câu cùng chủ đề, sai vẫn tiếp tục,
   giá trị vừa mở là mốc so sánh của câu kế tiếp.
   ═══════════════════════════════════════════════════════════════════ */
export function MoreOrLess() {
  /* state */
  const [phase, setPhase] = useState<Phase>('idle')
  const [turn, setTurn] = useState<Turn | null>(null)
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [high, setHigh] = useState(loadHigh)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  /** Mốc bắt đầu phiên chơi — timer chỉ đếm từ lúc bấm "Bắt đầu" lần đầu */
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  /** items[qIdx] = mốc bên trái, items[qIdx+1] = câu ẩn bên phải */
  const refItem = turn?.items[qIdx]
  const qItem = turn?.items[qIdx + 1]

  /* ─── Core logic ─── */
  const startGame = useCallback(() => {
    setTurn(pickTurn())
    setQIdx(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setLastCorrect(null)
    setStartedAt((prev) => prev ?? Date.now())
    setPhase('reveal')
  }, [])

  const handleGuess = useCallback(
    (guess: 'more' | 'less') => {
      if (phase !== 'reveal' || !refItem || !qItem) return
      const correct =
        guess === 'more' ? qItem.value > refItem.value : qItem.value < refItem.value
      if (correct) sfxWin()
      else sfxLose()

      if (correct) {
        setScore((s) => s + 1)
        setStreak((s) => {
          const next = s + 1
          setBestStreak((b) => Math.max(b, next))
          return next
        })
        setLastCorrect(true)
        setPhase('feedback-correct')
      } else {
        // Sai KHÔNG kết thúc lượt — chỉ mất điểm câu này, streak về 0
        setStreak(0)
        setLastCorrect(false)
        setPhase('feedback-wrong')
      }
    },
    [phase, refItem, qItem],
  )

  const nextQuestion = useCallback(() => {
    if (qIdx + 1 < QUESTIONS_PER_TURN) {
      // Mốc của câu kế chính là giá trị vừa mở ở câu này
      setQIdx((i) => i + 1)
      setLastCorrect(null)
      setPhase('reveal')
    } else {
      if (score > high) {
        setHigh(score)
        saveHigh(score)
      }
      setPhase('done')
    }
  }, [qIdx, score, high])

  /* tự chuyển câu sau feedback — đúng lẫn sai đều đi tiếp */
  useEffect(() => {
    if (phase === 'feedback-correct') {
      timerRef.current = setTimeout(nextQuestion, FEEDBACK_OK_MS)
    } else if (phase === 'feedback-wrong') {
      timerRef.current = setTimeout(nextQuestion, FEEDBACK_WRONG_MS)
    }
    return () => clearTimeout(timerRef.current)
  }, [phase, nextQuestion])

  /* ─── Render ─── */
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <PlayTimer startedAtMs={startedAt} />
      {/* ── Idle / Welcome ── */}
      {phase === 'idle' && (
        <div className="pop-in flex flex-col items-center gap-6 pt-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-peri-soft text-[40px]">
            🎯
          </span>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight md:text-[34px]">
              More or Less
            </h1>
            <p className="mx-auto mt-2 max-w-[380px] text-[15px] leading-relaxed text-muted-strong">
              Mỗi lượt <strong>5 câu liên tiếp cùng một chủ đề</strong>. Bên phải bị ẩn —
              nó <strong>MORE</strong> hay <strong>LESS</strong> hơn mốc bên trái?
            </p>
          </div>

          {high > 0 && (
            <div className="flex items-center gap-2 font-sans text-[14px] text-muted-strong">
              <CrownIcon size={16} />
              Điểm cao: <span className="font-bold text-ink">{high}/{QUESTIONS_PER_TURN}</span>
            </div>
          )}

          <button onClick={startGame} className="btn-primary px-8 py-3.5 text-[16px]">
            Bắt đầu
          </button>

          <div className="mt-2 max-w-[400px] rounded-2xl bg-soft p-4 text-[13px] leading-relaxed text-muted">
            <strong className="text-muted-strong">Luật chơi:</strong> đoán đúng → +1 điểm.
            Đoán sai → <strong>không bị loại</strong>, chỉ mất điểm câu đó và vẫn đi tiếp.
            Giá trị vừa mở sẽ thành <em>mốc so sánh</em> của câu kế tiếp. Mỗi lượt so
            <em> cùng loại, cùng cấp</em> — quốc gia với quốc gia, tỉnh với tỉnh, núi với
            núi… Chủ đề ngẫu nhiên: dân số, diện tích, GDP, đỉnh núi, tòa nhà, nghệ sĩ Việt…
          </div>

          <p className="text-[12px] leading-relaxed text-muted">
            Ảnh minh họa: Wikipedia/Wikimedia Commons, Deezer — dùng cho môi trường phát triển.
          </p>
        </div>
      )}

      {/* ── Playing / Feedback ── */}
      {(phase === 'reveal' || phase === 'feedback-correct' || phase === 'feedback-wrong') && turn && refItem && qItem && (
        <div className="flex flex-col gap-5">
          {/* Score + progress — x/y: x = điểm đang có, y = số lượt đã chọn */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-none items-center gap-2 font-sans text-[13px] tabular-nums text-muted">
              <span className="text-[18px] font-bold text-ink">
                {score}/{qIdx + 1}
              </span>
              {streak >= 2 && (
                <span className="ml-1 rounded-full bg-good-soft px-2 py-0.5 font-sans text-[12px] font-semibold text-good">
                  🔥 {streak}
                </span>
              )}
            </div>
            <ProgressBar
              current={qIdx + (phase === 'reveal' ? 0 : 1)}
              total={QUESTIONS_PER_TURN}
            />
          </div>

          {/* Ngữ cảnh: icon + label · đơn vị — cố định cả lượt vì cùng chủ đề */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[27px]" aria-hidden="true">{turn.pool.category.icon}</span>
            <span className="pill bg-soft font-sans text-[19px] font-medium text-muted-strong md:text-[20px]">
              {turn.pool.label}
              {turn.pool.unit && <span className="text-muted"> · {turn.pool.unit}</span>}
            </span>
          </div>

          {/* Hai thẻ giá trị — key theo ITEM, định vị qua CardSlot:
              sang câu sau thẻ vừa mở TRƯỢT từ phải sang trái giữ nguyên con số,
              thẻ mốc cũ mờ dần rời đi, thẻ "?" mới trượt vào từ phải */}
          <div className="relative h-[320px] md:h-[440px]">
            {(
              [
                ...(qIdx > 0 ? [{ item: turn.items[qIdx - 1], role: 'exit' as const }] : []),
                { item: refItem, role: 'left' as const },
                { item: qItem, role: 'right' as const },
              ]
            ).map(({ item, role }) => (
              <CardSlot key={`${item.text}|${item.value}`} role={role}>
                <ValueCard
                  text={item.text}
                  value={item.value}
                  unit={turn.pool.unit}
                  imgSrc={imgFor(turn.pool, item.text)}
                  hidden={role === 'right'}
                  revealed={role === 'right' ? phase !== 'reveal' : true}
                  isHigher={role === 'right' ? item.value > refItem.value : undefined}
                  isCorrect={role === 'right' ? (lastCorrect ?? undefined) : undefined}
                />
              </CardSlot>
            ))}
          </div>

          {/* VS divider */}
          <div className="-mt-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-line" />
            <span className="font-sans text-[12px] font-bold tracking-widest text-muted">VS</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {/* Nút đoán hoặc feedback */}
          {phase === 'reveal' && (
            <div className="pop-in flex gap-3" style={{ animationDelay: '0.1s' }}>
              <button
                onClick={() => handleGuess('less')}
                className="btn-secondary flex-1 py-4 font-sans text-[17px] font-bold tracking-wide md:py-5 md:text-[19px]"
              >
                ↓ LESS
              </button>
              <button
                onClick={() => handleGuess('more')}
                className="btn-primary flex-1 py-4 font-sans text-[17px] font-bold tracking-wide md:py-5 md:text-[19px]"
              >
                ↑ MORE
              </button>
            </div>
          )}

          {phase === 'feedback-correct' && (
            <div className="pop-in flex items-center justify-center gap-2 rounded-2xl bg-good-soft py-3 font-sans text-[15px] font-semibold text-good">
              <CheckIcon size={18} />
              Chính xác!
            </div>
          )}

          {phase === 'feedback-wrong' && (
            <div className="pop-in flex flex-col items-center gap-3">
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-bad-soft px-6 py-3 font-sans text-[15px] font-semibold text-bad">
                <XIcon size={18} />
                Sai rồi — mất điểm câu này, tiếp tục nhé!
              </div>
              <button onClick={nextQuestion} className="btn-ghost font-sans text-[14px]">
                Câu tiếp →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Game Over ── */}
      {phase === 'done' && (
        <div className="pop-in flex flex-col items-center gap-6 pt-4 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-[40px] text-accent-fg">
            {score === QUESTIONS_PER_TURN ? '🏆' : score >= 4 ? '⭐' : score >= 3 ? '👍' : '💪'}
          </span>

          <div>
            <h2 className="text-[26px] font-bold tracking-tight md:text-[30px]">
              {score === QUESTIONS_PER_TURN
                ? 'Tuyệt đối!'
                : score >= 4
                  ? 'Xuất sắc!'
                  : score >= 3
                    ? 'Khá tốt!'
                    : 'Cố gắng thêm!'}
            </h2>
            <p className="mt-1 font-sans text-[15px] text-muted-strong">
              Bạn đã đoán đúng <span className="font-bold text-ink">{score}/{QUESTIONS_PER_TURN}</span> câu
            </p>
          </div>

          <div className="grid w-full max-w-[360px] grid-cols-3 gap-3">
            <div className="card flex flex-col items-center gap-1 p-4">
              <span className="font-sans text-[24px] font-bold tabular-nums">{score}</span>
              <span className="text-[12px] text-muted">Điểm</span>
            </div>
            <div className="card flex flex-col items-center gap-1 p-4">
              <span className="font-sans text-[24px] font-bold tabular-nums">{bestStreak}</span>
              <span className="text-[12px] text-muted">Streak</span>
            </div>
            <div className="card flex flex-col items-center gap-1 p-4">
              <span className="font-sans text-[24px] font-bold tabular-nums">{high}</span>
              <span className="text-[12px] text-muted">Cao nhất</span>
            </div>
          </div>

          <button onClick={startGame} className="btn-primary px-8 py-3.5 text-[16px]">
            <ResetIcon size={17} />
            Chơi lại
          </button>
        </div>
      )}
    </div>
  )
}
