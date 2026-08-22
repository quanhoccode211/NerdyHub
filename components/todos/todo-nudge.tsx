'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTodos } from './todo-store'
import { daysUntil, type Todo } from '@/lib/todos'
import { TasksIcon, XIcon } from '../shell/icons'
import { onTestNudge, useReminderPrefs } from './reminder-prefs'

/**
 * Pill nhắc mục tiêu ở góc trên phải.
 *
 * CHỈ nhắc, không cho sửa: bấm vào là về Tổng quan, nơi có cả danh sách. Một
 * cái pill 300px mà tick được, xoá được thì thành widget thứ hai phải giữ đồng
 * bộ với widget thứ nhất, đổi lấy đúng một cú bấm tiết kiệm được.
 */

/* Nhịp nhắc do người dùng chọn ở Cài đặt — xem reminder-prefs.ts. */

/** Pill tự rút sau ngần này nếu không ai đụng vào. */
const VISIBLE_MS = 14_000
/** Lần nhắc gần nhất, lưu ở máy — xem ghi chú ở scheduleNext(). */
const LAST_KEY = 'todo-nudge-last'

/*
  CÂU NHẮC.

  Cố ý KHÔNG nằm trong lib/i18n/messages.ts: chủ dự án yêu cầu viết bằng tiếng
  Việt, mà mọi khoá trong file đó bắt buộc phải có đủ cả `en` lẫn `de` (thiếu là
  lỗi biên dịch). Nhét vào đấy nghĩa là phải bịa hai bản dịch cho một thứ được
  đặt hàng bằng đúng một thứ tiếng. Khi nào cần ba ngôn ngữ thì chuyển sang, và
  lúc đó dịch cho tử tế chứ đừng dịch máy.

  Giọng: nói như một người ngồi cạnh, không phải như một ứng dụng năng suất.
  Không "Cố lên nhé!!!", không emoji, không hô khẩu hiệu — người ta tự đặt ra
  mục tiêu này, họ không cần ai cổ vũ, chỉ cần được nhắc.
*/
const LINES = [
  (task: string) => `Còn “${task}” đang chờ bạn.`,
  (task: string) => `Nhắc nhẹ: “${task}”.`,
  (task: string) => `“${task}” vẫn nằm trong danh sách.`,
  (task: string) => `Hôm nay bạn định làm “${task}”.`,
  (task: string) => `“${task}” chưa được tick.`,
]

/** Việc có hạn thì nói thẳng còn mấy ngày — đó mới là thông tin người ta cần. */
function lineFor(todo: Todo, turn: number): string {
  if (todo.dueDate) {
    const left = daysUntil(todo.dueDate)
    if (left < 0) return `“${todo.text}” đã quá hạn ${-left} ngày.`
    if (left === 0) return `“${todo.text}” hết hạn hôm nay.`
    if (left === 1) return `“${todo.text}” hết hạn ngày mai.`
    if (left <= 7) return `“${todo.text}” còn ${left} ngày nữa là tới hạn.`
  }
  return LINES[turn % LINES.length](todo.text)
}

/**
 * Việc được nhắc: quá hạn trước, rồi tới hạn gần nhất, rồi mới tới việc trong
 * ngày. Nhắc một việc mỗi lần chứ không đọc cả danh sách — một cái pill liệt kê
 * năm dòng thì không còn là lời nhắc, nó là widget đặt nhầm chỗ.
 */
function pick(todos: Todo[], turn: number): Todo | null {
  const open = todos.filter((t) => !t.done)
  if (open.length === 0) return null

  const dated = open
    .filter((t) => t.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
  if (dated.length > 0) return dated[0]

  /* Không có việc nào có hạn: xoay vòng để lần nào cũng nhắc đúng một việc thì
     lâu dần người ta thôi nhìn nó. */
  return open[turn % open.length]
}

export function TodoNudge() {
  const { todos, ready } = useTodos()
  const { enabled, intervalMin } = useReminderPrefs()
  const [open, setOpen] = useState(false)
  const [turn, setTurn] = useState(0)
  /** Lượt hiện này do nút "Thử ngay" gọi ra, không phải do hẹn giờ. */
  const [testing, setTesting] = useState(false)

  const hide = useCallback(() => {
    setOpen(false)
    setTesting(false)
  }, [])

  /*
    NÚT THỬ KHÔNG ĐỤNG VÀO HẸN GIỜ THẬT: không ghi `LAST_KEY`, không huỷ
    `timer`. Bấm thử ba lần mà lần nhắc thật bị đẩy lùi ba lần thì cái nút dùng
    để kiểm tra lại chính là thứ làm hỏng thứ nó kiểm tra.

    Cũng KHÔNG xét `enabled`: người ta bấm thử để quyết định có bật hay không,
    nên bắt bật trước mới xem được là ngược đời.
  */
  useEffect(
    () =>
      onTestNudge(() => {
        setTurn((n) => n + 1)
        setTesting(true)
        setOpen(true)
      }),
    [],
  )

  const everyMs = intervalMin * 60 * 1000

  useEffect(() => {
    if (!ready || !enabled) return

    /*
      HẸN GIỜ TÍNH TỪ LẦN NHẮC GẦN NHẤT, không phải từ lúc trang mở.

      Đặt thẳng một `setTimeout(everyMs)` lúc mount thì ai tải lại trang trước
      mốc đó sẽ đẩy lùi lời nhắc mãi mãi — mà tải lại trang là chuyện xảy ra
      suốt. Ngược lại, ai mở tab mới liên tục thì bị nhắc liên tục.
      Mốc phải sống ngoài vòng đời của trang, nên nó nằm ở localStorage.
    */
    let timer: number | undefined

    const readLast = () => {
      try {
        return Number(localStorage.getItem(LAST_KEY)) || 0
      } catch {
        return 0
      }
    }

    const show = () => {
      /* Đọc lại danh sách ngay lúc bật: nó có thể đã đổi kể từ lúc hẹn giờ. */
      setTurn((n) => n + 1)
      setOpen(true)
      try {
        localStorage.setItem(LAST_KEY, String(Date.now()))
      } catch {
        /* riêng tư / hết quota — mất mốc thì nhắc sớm hơn, không đáng để hỏng */
      }
      timer = window.setTimeout(schedule, everyMs)
    }

    const schedule = () => {
      const waited = Date.now() - readLast()
      /*
        Tới hạn rồi (kể cả lần đầu, khi chưa có mốc nào) thì vẫn nán 20 giây.
        Bật pill ngay lúc trang vừa hiện ra là nó chen vào giữa lúc người ta còn
        đang đọc trang, và mắt đọc nó thành một mẩu quảng cáo.
      */
      timer = window.setTimeout(show, Math.max(everyMs - waited, 20_000))
    }

    schedule()
    return () => window.clearTimeout(timer)
    /* `everyMs` trong deps: đổi nhịp ở Cài đặt là hẹn lại ngay, không phải chờ
       hết vòng cũ rồi nhịp mới mới có tác dụng. */
  }, [ready, enabled, everyMs])

  /* Tự rút sau VISIBLE_MS. Tách khỏi effect trên để lần bấm "đóng" của người
     dùng không phải đợi hết giờ mới có tác dụng. */
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(hide, VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [open, hide])

  const real = ready ? pick(todos, turn) : null
  /*
    Lượt thử mà danh sách trống thì mượn một việc mẫu. Không có nhánh này thì
    người chưa ghi việc nào bấm "Thử ngay" và KHÔNG THẤY GÌ — đúng nhóm người
    cần xem thử nhất lại là nhóm nút này im lặng với họ.
  */
  const todo: Todo | null =
    real ?? (testing ? { id: 'test', text: 'Làm 1 đề Nghe VSTEP', done: false, dueDate: null } : null)

  if (!todo) return null
  if (!open) return null
  if (!enabled && !testing) return null

  return (
    /*
      `fixed`, và neo dưới hàng header chứ không sát mép trên: góc trên phải của
      màn hình đã có chuông và avatar, pill đè lên đó là che mất hai nút.

      `role="status"` + `aria-live="polite"`: trình đọc màn hình đọc lời nhắc
      khi nó hiện ra, nhưng chờ hết câu đang đọc dở. `assertive` sẽ cắt ngang
      giữa chừng, mà đây chỉ là một lời nhắc.

      Nền xanh, chữ trắng, Helvetica Bold — xem `.todo-nudge` ở globals.css.
      Màu và font đặt ở CSS chứ không rải class Tailwind vào đây, để bảng xem
      trước bên Cài đặt dùng lại được đúng một class và không bao giờ lệch.
    */
    <div
      role="status"
      aria-live="polite"
      className="todo-nudge fixed top-[92px] right-5 z-[70] flex max-w-[min(340px,calc(100vw-2.5rem))] items-start gap-2.5 rounded-2xl p-3 shadow-[0_16px_40px_rgba(24,28,45,.18)] md:right-8"
    >
      <span className="flex-none pt-0.5">
        <TasksIcon size={15} />
      </span>
      <Link
        href="/dashboard"
        onClick={hide}
        className="min-w-0 flex-1 text-[14px] leading-relaxed underline-offset-2 hover:underline"
      >
        {lineFor(todo, turn)}
      </Link>
      <button
        type="button"
        onClick={hide}
        aria-label="Đóng lời nhắc"
        className="flex-none rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <XIcon size={14} />
      </button>
    </div>
  )
}
