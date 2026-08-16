'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CardHeader } from '../shell/app-shell'
import { PlusIcon, TasksIcon, XIcon } from '../shell/icons'

/**
 * "Việc hôm nay" — danh sách mục tiêu ngắn trong ngày, tự người dùng đặt ra.
 *
 * Lưu ở localStorage chứ không phải database: web dùng được khi chưa đăng nhập,
 * và mục tiêu trong ngày là thứ riêng tư, nhất thời, không đáng để đánh đổi lấy
 * một vòng gọi API. Bản đồng bộ xuống DB tách thành đợt sau.
 *
 * SANG NGÀY MỚI thì việc đã xong bị dọn đi, việc chưa xong được giữ lại. Xoá
 * sạch mỗi sáng thì người dùng mất luôn thứ họ còn nợ; giữ nguyên tất cả thì sau
 * một tuần danh sách toàn dấu tích cũ. Mang phần còn nợ sang là đúng với cách
 * người ta thật sự dùng một danh sách việc trong ngày.
 */

const STORAGE_KEY = 'daily-tasks-v1'

/** Trần 5 việc — quá số đó thì đây không còn là "mục tiêu gần trong ngày" nữa. */
const MAX_TASKS = 5
const MAX_LEN = 80

type Task = { id: string; text: string; done: boolean }
type Persisted = { date: string; tasks: Task[] }

/** Ngày local dạng YYYY-MM-DD. Không dùng toISOString: nó quy về UTC, sau 7h tối
 *  giờ Việt Nam sẽ nhảy sang ngày hôm sau và dọn danh sách sớm mất nửa buổi. */
function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function load(): Persisted {
  const fresh: Persisted = { date: today(), tasks: [] }
  if (typeof window === 'undefined') return fresh
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const saved = JSON.parse(raw) as Persisted
    if (!Array.isArray(saved.tasks)) return fresh
    if (saved.date === fresh.date) return saved
    // Ngày mới: bỏ việc đã xong, mang việc còn nợ sang
    return { date: fresh.date, tasks: saved.tasks.filter((t) => !t.done) }
  } catch {
    return fresh
  }
}

function save(state: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* hết quota — không đáng làm hỏng cả widget */
  }
}

export function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [draft, setDraft] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Nạp từ localStorage SAU khi mount — cùng lý do với usePomodoro: server không
   * đọc được localStorage nên lần render đầu buộc phải ra mặc định, đọc trong
   * lúc render sẽ lệch hydrate.
   */
  useEffect(() => {
    const saved = load()
    /*
      Ghi lại NGAY, kể cả khi không có gì đổi. `load()` chỉ dọn danh sách trong
      bộ nhớ, còn localStorage vẫn mang ngày cũ — để nguyên thì có một khe hở:
      mở tab lúc 23h59, qua nửa đêm mới tick một việc, `commit` sẽ đóng dấu ngày
      hôm nay lên nguyên danh sách của hôm qua kể cả các việc đã xong. Ghi lại ở
      đây là idempotent và bịt hẳn khe đó.
    */
    save({ date: today(), tasks: saved.tasks })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(saved.tasks)
    setHydrated(true)
  }, [])

  const commit = useCallback((next: Task[]) => {
    setTasks(next)
    save({ date: today(), tasks: next })
  }, [])

  const add = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const text = draft.trim().slice(0, MAX_LEN)
      if (!text || tasks.length >= MAX_TASKS) return
      commit([...tasks, { id: crypto.randomUUID(), text, done: false }])
      setDraft('')
      inputRef.current?.focus()
    },
    [draft, tasks, commit],
  )

  const toggle = useCallback(
    (id: string) => commit(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    [tasks, commit],
  )

  const remove = useCallback(
    (id: string) => commit(tasks.filter((t) => t.id !== id)),
    [tasks, commit],
  )

  const doneCount = tasks.filter((t) => t.done).length
  const full = tasks.length >= MAX_TASKS

  return (
    <section className="card flex flex-col p-5 md:p-6">
      <CardHeader
        icon={<TasksIcon size={17} />}
        title="To-do list"
        meta={
          hydrated && tasks.length > 0 ? (
            <span className="pill bg-soft text-[13px] text-muted-strong">
              {doneCount}/{tasks.length} xong
            </span>
          ) : null
        }
      />

      {/*
        Chừa chỗ trước khi nạp xong để thẻ không co giật một nhịp khi hydrate.
        aria-busy để trình đọc màn hình không đọc danh sách rỗng thành "không có
        việc nào" trong lúc còn đang đọc localStorage.
      */}
      {!hydrated ? (
        <div className="min-h-[172px]" aria-busy="true" />
      ) : (
        <>
          {tasks.length === 0 ? (
            <div className="panel flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
              <p className="text-[15px] font-medium">Hôm nay bạn muốn làm gì?</p>
              <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-muted">
                Ghi ra vài việc nhỏ và cụ thể — kiểu &ldquo;làm 1 đề Nghe VSTEP&rdquo; — rồi
                tick khi xong.
              </p>
            </div>
          ) : (
            <ul className="flex flex-1 flex-col gap-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-center gap-2.5 rounded-2xl px-1 py-1.5">
                  {/*
                    Ô tick là <input type="checkbox"> THẬT, chỉ bỏ hình mặc định
                    bằng appearance-none. Không dùng sr-only + <span> vẽ tay: làm
                    thế thì viền focus của bàn phím rơi lên một phần tử 1×1px và
                    người dùng tab tới không thấy mình đang ở đâu.
                  */}
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggle(t.id)}
                    id={`task-${t.id}`}
                    className="h-[19px] w-[19px] flex-none cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-card bg-[length:11px] bg-center bg-no-repeat transition-colors checked:border-accent checked:bg-accent checked:bg-[image:var(--check-mark)]"
                  />
                  <label
                    htmlFor={`task-${t.id}`}
                    className={`min-w-0 flex-1 cursor-pointer text-[14.5px] leading-snug break-words transition-colors ${
                      t.done ? 'text-muted line-through' : 'text-ink'
                    }`}
                  >
                    {t.text}
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    aria-label={`Xoá việc: ${t.text}`}
                    /* Hiện khi rê chuột HOẶC khi focus bằng bàn phím — chỉ
                       group-hover thì người dùng bàn phím không bao giờ thấy. */
                    className="flex-none rounded-full p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-bad focus-visible:opacity-100"
                  >
                    <XIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={add} className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_LEN}
              disabled={full}
              placeholder={full ? `Đủ ${MAX_TASKS} việc rồi` : 'Thêm một việc…'}
              aria-label="Thêm việc cho hôm nay"
              className="min-w-0 flex-1 rounded-pill bg-soft px-4 py-2 text-[14.5px] outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={full || draft.trim() === ''}
              className="icon-circle disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Thêm việc"
            >
              <PlusIcon size={16} />
            </button>
          </form>
        </>
      )}
    </section>
  )
}
