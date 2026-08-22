'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckIcon, XIcon, ResetIcon, CrownIcon } from '../shell/icons'
import { WORDS, meaningOf } from './wordle-words'
import { PlayTimer } from './play-timer'
import { sfxTick, sfxWin, sfxLose } from './game-sfx'

/**
 * Wordle từ vựng tiếng Anh (5 chữ cái, từ A2–B1 dễ nhớ).
 *
 * BÀN PHÍM GIỚI HẠN 12 PHÍM: đúng 5 chữ cái của đáp án + 7 chữ cái nhiễu.
 * Người chơi chỉ được ghép từ từ 12 chữ này — không đoán mò trong 26 chữ,
 * mà phải suy luận chữ nào có mặt. Chuẩn bị theo QWERTY cho quen tay.
 *
 * Hai chế độ:
 *   • Trong ngày  — cả mọi người cùng MỘT từ; bộ 12 phím sinh seeded theo
 *                   đáp án nên reload không đổi; xong khoá tới 0:00 ngày mai
 *   • Luyện tập   — từ + bộ phím ngẫu nhiên vô hạn
 *
 * Gõ bàn phím vật lý vẫn được, chữ ngoài bộ 12 phím sẽ bị nhắc nhẹ.
 */

const WORD_LEN = 5
const MAX_GUESSES = 6
const DAILY_KEY = 'wordle-daily-v1'
const STATS_KEY = 'wordle-stats-v1'
const REVEAL_STEP_MS = 130
const ERROR_MS = 1_600
/** 7 chữ cái nhiễu + 5 chữ đáp án = 12 phím */
const NOISE_LETTERS = 7

type Mark = 'correct' | 'present' | 'absent'
type Status = 'playing' | 'won' | 'lost'
type Mode = 'daily' | 'practice'

type Stats = { played: number; wins: number; streak: number; best: number; dist: number[] }

const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  streak: 0,
  best: 0,
  dist: Array(MAX_GUESSES).fill(0),
}

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 }

const WIN_MSG = [
  'Phi thường!',
  'Tuyệt vời!',
  'Giỏi lắm!',
  'Khá nhanh!',
  'Vững vàng!',
  'Về đích trong gang tấc!',
]

/* ─── Từ hôm nay — deterministic theo ngày, không cần server ─── */

function todayKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function dailyWord(): string {
  return WORDS[hashSeed(todayKey()) % WORDS.length][0]
}

/* ─── Shuffle: seeded cho daily (reload không đổi), random cho luyện tập ─── */

function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomShuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Số chữ cái (duy nhất) trong từ — dùng khi chọn nhiễu. */
function uniqueLetters(w: string): string[] {
  return [...new Set(w.split(''))]
}

function randomPracticeWord(exclude: string): string {
  for (let i = 0; i < 20; i++) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)][0]
    if (w !== exclude) return w
  }
  return WORDS[0][0]
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

/**
 * Bộ 12 phím: 5 chữ của đáp án + 7 chữ nhiễu, sắp theo thứ tự QWERTY.
 * seed = null → luyện tập, nhiễu trộn bằng Math.random.
 */
function buildLetters(answer: string, seed: number | null): string[] {
  const pick = <T,>(arr: T[]) => (seed === null ? randomShuffle(arr) : seededShuffle(arr, seed))
  const inAnswer = new Set(uniqueLetters(answer))
  const noise = pick(ALPHABET.split('').filter((c) => !inAnswer.has(c))).slice(0, NOISE_LETTERS)
  const all = new Set([...uniqueLetters(answer), ...noise])
  // thứ tự QWERTY để quen tay
  const qwerty = KEY_ROWS.join('').toLowerCase()
  return qwerty.split('').filter((c) => all.has(c))
}

/* ─── Chấm một lượt đoán theo luật Wordle ─── */

function evaluateGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(WORD_LEN).fill('absent')
  const remaining: Record<string, number> = {}
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) marks[i] = 'correct'
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (marks[i] === 'correct') continue
    const c = guess[i]
    if ((remaining[c] ?? 0) > 0) {
      marks[i] = 'present'
      remaining[c]--
    }
  }
  return marks
}

/** Màu bàn phím: giữ cấp cao nhất từng thấy của mỗi phím. */
function keyMarks(guesses: string[], answer: string): Record<string, Mark> {
  const map: Record<string, Mark> = {}
  for (const g of guesses) {
    const marks = evaluateGuess(g, answer)
    for (let i = 0; i < WORD_LEN; i++) {
      const c = g[i]
      if (!map[c] || RANK[marks[i]] > RANK[map[c]]) map[c] = marks[i]
    }
  }
  return map
}

/* ─── Tiện ích localStorage ─── */

function loadJSON<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* hết quota — game vẫn chơi được, chỉ mất thống kê */
  }
}

type DailySave = { date: string; guesses: string[]; status: Status }

/* ═══════════════════════════════════════════════════════════════════ */

export function WordleGame() {
  const [mode, setMode] = useState<Mode>('daily')
  const [answer, setAnswer] = useState(dailyWord)
  const [guesses, setGuesses] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState<Status>('playing')
  /** Số ô đã lật của hàng vừa submit (WORD_LEN = lật xong) */
  const [reveal, setReveal] = useState(WORD_LEN)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  /** Timer phiên chơi — bắt đầu đếm từ phím đầu tiên */
  const [startedAt, setStartedAt] = useState<number | null>(null)

  /* Bộ 12 phím — daily seeded theo đáp án, luyện tập random mỗi ván */
  const [letters, setLetters] = useState<string[]>(() => {
    const w = dailyWord()
    return buildLetters(w, hashSeed(w))
  })

  /* Khôi phục ván trong ngày + thống kê sau mount (localStorage chỉ có ở client) */
  useEffect(() => {
    const saved = loadJSON<DailySave>(DAILY_KEY)
    if (saved?.date === todayKey()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuesses(saved.guesses)
      setStatus(saved.status)
    }
    setStats(loadJSON<Stats>(STATS_KEY) ?? EMPTY_STATS)
  }, [])

  /* Lật ô lần lượt của hàng vừa submit */
  useEffect(() => {
    if (reveal >= WORD_LEN) return
    const t = setTimeout(() => setReveal((r) => r + 1), REVEAL_STEP_MS)
    return () => clearTimeout(t)
  }, [reveal])

  const flashError = useCallback((msg: string) => {
    setError(msg)
    setTimeout(() => setError((e) => (e === msg ? null : e)), ERROR_MS)
  }, [])

  const submit = useCallback(() => {
    if (status !== 'playing' || reveal !== WORD_LEN) return
    if (current.length < WORD_LEN) {
      flashError('Chưa đủ 5 chữ cái')
      return
    }
    const g = current
    const next = [...guesses, g]
    setGuesses(next)
    setCurrent('')
    setReveal(0)
    sfxTick()

    const won = g === answer
    const lost = !won && next.length >= MAX_GUESSES
    if (!won && !lost) return

    setStatus(won ? 'won' : 'lost')
    // chờ lật xong 5 ô rồi mới nổi nhạc thắng/thua
    setTimeout(won ? sfxWin : sfxLose, WORD_LEN * REVEAL_STEP_MS + 120)

    if (mode === 'daily') {
      saveJSON(DAILY_KEY, {
        date: todayKey(),
        guesses: next,
        status: won ? 'won' : 'lost',
      } satisfies DailySave)
      setStats((prev) => {
        const used = next.length // số lượt đã dùng (1..6)
        const nextStats: Stats = {
          played: prev.played + 1,
          wins: prev.wins + (won ? 1 : 0),
          streak: won ? prev.streak + 1 : 0,
          best: won ? Math.max(prev.best, prev.streak + 1) : prev.best,
          dist: prev.dist.map((d, i) => (i === used - 1 ? d + 1 : d)),
        }
        saveJSON(STATS_KEY, nextStats)
        return nextStats
      })
    }
  }, [status, reveal, current, guesses, answer, mode, flashError])

  const pressKey = useCallback(
    (key: string) => {
      if (status !== 'playing' || reveal !== WORD_LEN) return
      setStartedAt((prev) => prev ?? Date.now())
      if (key === 'Enter') {
        submit()
      } else if (key === 'Backspace') {
        setCurrent((c) => c.slice(0, -1))
      } else if (/^[a-z]$/.test(key)) {
        // Bàn phím giới hạn: chữ ngoài bộ 12 phím không dùng được
        if (!letters.includes(key)) {
          flashError('Chữ này không có trên bàn phím')
          return
        }
        setCurrent((c) => (c.length < WORD_LEN ? c + key : c))
      }
    },
    [status, reveal, submit, letters, flashError],
  )

  /* Bàn phím vật lý */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') pressKey('Enter')
      else if (e.key === 'Backspace') pressKey('Backspace')
      else if (/^[a-zA-Z]$/.test(e.key)) pressKey(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pressKey])

  const startPractice = useCallback(() => {
    const w = randomPracticeWord(answer)
    setMode('practice')
    setAnswer(w)
    setLetters(buildLetters(w, null))
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setReveal(WORD_LEN)
  }, [answer])

  const backToDaily = useCallback(() => {
    const w = dailyWord()
    setMode('daily')
    setAnswer(w)
    setLetters(buildLetters(w, hashSeed(w)))
    setCurrent('')
    setReveal(WORD_LEN)
    const saved = loadJSON<DailySave>(DAILY_KEY)
    if (saved?.date === todayKey()) {
      setGuesses(saved.guesses)
      setStatus(saved.status)
    } else {
      setGuesses([])
      setStatus('playing')
    }
  }, [])

  const km = useMemo(() => keyMarks(guesses, answer), [guesses, answer])
  const finished = status !== 'playing' && reveal === WORD_LEN

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-5">
      <PlayTimer startedAtMs={startedAt} />

      {/* Chế độ */}
      <div className="flex gap-1.5 rounded-pill bg-soft p-1">
        <button
          type="button"
          onClick={backToDaily}
          aria-pressed={mode === 'daily'}
          className={`rounded-pill px-5 py-2 text-[14px] font-medium transition-colors ${
            mode === 'daily' ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          Trong ngày
        </button>
        <button
          type="button"
          onClick={startPractice}
          aria-pressed={mode === 'practice'}
          className={`rounded-pill px-5 py-2 text-[14px] font-medium transition-colors ${
            mode === 'practice' ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          Luyện tập
        </button>
      </div>

      {/* Bảng 6×5 */}
      <div className="grid grid-cols-5 gap-2 md:gap-2.5">
        {Array.from({ length: MAX_GUESSES }).map((_, r) => (
          <Row
            key={r}
            guess={guesses[r] ?? ''}
            typing={r === guesses.length && status === 'playing' ? current : ''}
            marks={guesses[r] ? evaluateGuess(guesses[r], answer) : null}
            revealedCount={
              r < guesses.length - 1 ? WORD_LEN : r === guesses.length - 1 ? reveal : WORD_LEN
            }
          />
        ))}
      </div>

      {/* Thông báo lỗi ngắn */}
      <p className="min-h-[20px] text-center text-[13.5px] font-medium text-red" role="status">
        {error ?? ''}
      </p>

      {/* Bàn phím 12 phím: 5 chữ đáp án + 7 chữ nhiễu, thứ tự QWERTY */}
      <Keyboard letters={letters} marks={km} onKey={pressKey} disabled={status !== 'playing'} />

      {/* Kết thúc ván: đáp án + nghĩa + thống kê */}
      {finished && (
        <div className="pop-in w-full max-w-[460px] rounded-2xl border border-line bg-card p-5 text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
              status === 'won' ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
            }`}
          >
            {status === 'won' ? <CheckIcon size={22} /> : <XIcon size={22} />}
          </div>

          <h2 className="mt-3 text-[19px] font-bold">
            {status === 'won' ? WIN_MSG[guesses.length - 1] : 'Hết lượt rồi — ghi nhớ từ này nhé!'}
          </h2>

          <p className="mt-2 text-[16px]">
            <span className="font-bold tracking-wide uppercase">{answer}</span>
            {meaningOf(answer) && (
              <span className="text-muted-strong"> — {meaningOf(answer)}</span>
            )}
          </p>

          {mode === 'daily' ? (
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label="Đã chơi" value={String(stats.played)} />
                <Stat
                  label="Thắng"
                  value={stats.played ? `${Math.round((stats.wins / stats.played) * 100)}%` : '0%'}
                />
                <Stat label="Chuỗi" value={String(stats.streak)} />
                <Stat label="Cao nhất" value={String(stats.best)} />
              </div>
              <DistBars dist={stats.dist} />
              <div className="flex flex-col gap-2">
                <button type="button" onClick={startPractice} className="btn-primary">
                  Luyện tập thêm
                </button>
                <p className="text-[13px] text-muted">
                  <CrownIcon size={13} className="mr-1 inline" />
                  Từ mới vào 0:00 ngày mai
                </p>
              </div>
            </div>
          ) : (
            <button type="button" onClick={startPractice} className="btn-primary mx-auto mt-4">
              <ResetIcon size={16} />
              Từ khác
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Một hàng 5 ô ─── */

function Row({
  guess,
  typing,
  marks,
  revealedCount,
}: {
  guess: string
  typing: string
  marks: Mark[] | null
  revealedCount: number
}) {
  return (
    <>
      {Array.from({ length: WORD_LEN }).map((_, c) => {
        const letter = guess[c] ?? typing[c] ?? ''
        const mark = marks && c < revealedCount ? marks[c] : null
        // Hàng cuối đang lật: ô vừa nhận màu chạy animation flip
        const flipping = marks !== null && c === revealedCount - 1 && revealedCount <= WORD_LEN
        return (
          <div
            key={c}
            className={[
              'flex h-[58px] w-[58px] items-center justify-center rounded-xl border-2 text-[26px] font-bold uppercase md:h-[66px] md:w-[66px] md:text-[30px]',
              mark === 'correct' && 'border-good bg-good text-white',
              mark === 'present' && 'border-warn bg-warn text-white',
              mark === 'absent' && 'border-line bg-soft text-muted-strong',
              !mark && (letter ? 'border-line-strong text-ink' : 'border-line'),
              flipping && 'tile-flip',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {letter}
          </div>
        )
      })}
    </>
  )
}

/* ─── Bàn phím trên màn hình: đúng 12 phím của ván này ─── */

function Keyboard({
  letters,
  marks,
  onKey,
  disabled,
}: {
  letters: string[]
  marks: Record<string, Mark>
  onKey: (key: string) => void
  disabled: boolean
}) {
  const cls = (m?: Mark) =>
    m === 'correct'
      ? 'bg-good text-white'
      : m === 'present'
        ? 'bg-warn text-white'
        : m === 'absent'
          ? 'bg-soft text-muted'
          : 'bg-card text-ink'

  const keyBtn = (k: string) => (
    <button
      key={k}
      type="button"
      onClick={() => onKey(k)}
      disabled={disabled}
      className={`flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-lg text-[18px] font-bold uppercase transition-colors disabled:opacity-50 md:h-[58px] md:text-[20px] ${cls(marks[k])}`}
    >
      {k}
    </button>
  )

  // 12 phím chia 2 hàng × 6, hàng dưới là NHẬP + xoá
  const rows = [letters.slice(0, 6), letters.slice(6, 12)]

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-1.5 select-none">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 md:gap-2">
          {row.map(keyBtn)}
        </div>
      ))}
      <div className="flex justify-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={() => onKey('Backspace')}
          disabled={disabled}
          aria-label="Xoá một chữ"
          className="flex h-[52px] flex-1 items-center justify-center rounded-lg bg-card text-[20px] font-bold text-ink transition-colors hover:bg-soft disabled:opacity-50 md:h-[58px]"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => onKey('Enter')}
          disabled={disabled}
          className="flex h-[52px] flex-[2] items-center justify-center rounded-lg bg-card text-[13px] font-bold text-ink transition-colors hover:bg-soft disabled:opacity-50 md:h-[58px] md:text-[14px]"
        >
          NHẬP
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-soft p-2">
      <div className="text-[17px] font-bold tabular-nums">{value}</div>
      <div className="text-[11.5px] text-muted">{label}</div>
    </div>
  )
}

/** Phân bố số lượt dùng — thanh ngang như Wordle gốc */
function DistBars({ dist }: { dist: number[] }) {
  const max = Math.max(1, ...dist)
  return (
    <div className="flex flex-col gap-1">
      {dist.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="w-3 text-muted tabular-nums">{i + 1}</span>
          <div
            className={`flex h-[18px] min-w-[24px] items-center justify-end rounded px-1.5 text-[11px] font-semibold text-white tabular-nums ${
              d === max && d > 0 ? 'bg-good' : 'bg-soft text-muted-strong'
            }`}
            style={{ width: `${Math.max(12, (d / max) * 100)}%` }}
          >
            {d}
          </div>
        </div>
      ))}
    </div>
  )
}
