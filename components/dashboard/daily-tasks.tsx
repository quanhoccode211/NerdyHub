'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { CardHeader } from '../shell/app-shell'
import { useLocale } from '../i18n/locale-provider'
import { useTodos } from '../todos/todo-store'
import { MAX_LEN, MAX_TASKS, dueDateFromDayMonth, formatDue, daysUntil } from '@/lib/todos'
import { CalendarIcon, PlusIcon, TasksIcon, XIcon } from '../shell/icons'

/**
 * "To-do list" — mục tiêu người dùng tự đặt ra.
 *
 * NHẬP LÀ MỘT LUỒNG HAI BƯỚC, không phải một ô rồi Enter:
 *
 *   gõ mục tiêu
 *     ├── chưa đăng nhập -> mời đăng nhập để được lưu (vẫn thêm tạm được)
 *     └── đã đăng nhập   -> hỏi hạn: "Hằng ngày", hoặc chọn ngày/tháng
 *
 * Bước hỏi hạn nằm NGAY TRONG THẺ chứ không phải một hộp thoại nổi. Thêm một
 * việc là thao tác nhỏ và lặp lại nhiều lần; một hộp thoại phủ màn hình cho mỗi
 * dòng khiến người ta thôi không thêm nữa.
 *
 * Chỗ lưu và phép tính ngày ở components/todos/todo-store.ts và lib/todos.ts.
 */

/** Bước đang đứng trong luồng nhập. `idle` = chỉ có ô gõ. */
type Step = 'idle' | 'signin' | 'deadline'

export function DailyTasks() {
  const { t } = useLocale()
  const { todos, ready, authed, authKnown, full, add, toggle, remove } = useTodos()

  const [draft, setDraft] = useState('')
  const [step, setStep] = useState<Step>('idle')
  /** Mục tiêu đang chờ chọn hạn — giữ riêng để ô gõ trống lại ngay. */
  const [pending, setPending] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [dateError, setDateError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const text = draft.trim().slice(0, MAX_LEN)
      if (!text || full) return
      setPending(text)
      setDraft('')
      /* Chưa biết đã đăng nhập hay chưa (`status === 'loading'`) thì hỏi hạn
         luôn — đoán sang nhánh mời đăng nhập rồi hoá ra người ta đã đăng nhập
         là một lời mời sai thẳng vào mặt. */
      setStep(authed || !authKnown ? 'deadline' : 'signin')
    },
    [draft, full, authed, authKnown],
  )

  const finish = useCallback(
    async (dueDate: string | null) => {
      await add(pending, dueDate)
      setPending('')
      setStep('idle')
      setDay('')
      setMonth('')
      setDateError(false)
      inputRef.current?.focus()
    },
    [add, pending],
  )

  const cancel = useCallback(() => {
    /* Trả chữ về ô gõ chứ không vứt đi: người bấm Huỷ là đang đổi ý về cái HẠN,
       không phải về mục tiêu vừa gõ xong. */
    setDraft(pending)
    setPending('')
    setStep('idle')
    setDateError(false)
  }, [pending])

  const confirmDate = useCallback(() => {
    const due = dueDateFromDayMonth(Number(day), Number(month))
    if (!due) {
      setDateError(true)
      return
    }
    void finish(due.toISOString())
  }, [day, month, finish])

  const doneCount = todos.filter((t) => t.done).length

  return (
    <section className="card flex flex-col p-5 md:p-6">
      <CardHeader
        icon={<TasksIcon size={17} />}
        title="To-do list"
        meta={
          ready && todos.length > 0 ? (
            <span className="pill bg-soft text-[13px] text-muted-strong">
              {doneCount}/{todos.length} xong
            </span>
          ) : null
        }
      />

      {/*
        Chừa chỗ trước khi nạp xong để thẻ không co giật một nhịp khi hydrate.
        aria-busy để trình đọc màn hình không đọc danh sách rỗng thành "không có
        việc nào" trong lúc còn đang đọc dữ liệu.
      */}
      {!ready ? (
        <div className="min-h-[172px]" aria-busy="true" />
      ) : (
        <>
          {todos.length === 0 ? (
            <div className="panel flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
              <p className="text-[15px] font-medium">{t('tasks.prompt')}</p>
              <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-muted">
                {t('tasks.hint')}
              </p>
            </div>
          ) : (
            <ul className="flex flex-1 flex-col gap-1.5">
              {todos.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-center gap-2.5 rounded-2xl px-1 py-1.5"
                >
                  {/*
                    Ô tick là <input type="checkbox"> THẬT, chỉ bỏ hình mặc định
                    bằng appearance-none. Không dùng sr-only + <span> vẽ tay: làm
                    thế thì viền focus của bàn phím rơi lên một phần tử 1×1px và
                    người dùng tab tới không thấy mình đang ở đâu.
                  */}
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => void toggle(item.id)}
                    id={`task-${item.id}`}
                    className="h-[19px] w-[19px] flex-none cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-card bg-[length:11px] bg-center bg-no-repeat transition-colors checked:border-accent checked:bg-accent checked:bg-[image:var(--check-mark)]"
                  />
                  <label
                    htmlFor={`task-${item.id}`}
                    className={`min-w-0 flex-1 cursor-pointer text-[14.5px] leading-snug break-words transition-colors ${
                      item.done ? 'text-muted line-through' : 'text-ink'
                    }`}
                  >
                    {item.text}
                  </label>
                  {item.dueDate && !item.done && <DuePill due={item.dueDate} />}
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    aria-label={`Xoá việc: ${item.text}`}
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

          {/* ---------- BƯỚC 2a: mời đăng nhập ---------- */}
          {step === 'signin' && (
            <div className="mt-3 rounded-2xl border border-line bg-soft p-3.5">
              <p className="text-[14.5px] font-medium">{t('tasks.signInTitle')}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted-strong">
                {t('tasks.signInBody')}
              </p>
              <p className="mt-2 truncate text-[13.5px] text-muted">“{pending}”</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href="/dang-nhap" className="btn-primary px-4 py-2 text-[14px]">
                  {t('tasks.signInCta')}
                </Link>
                <button
                  type="button"
                  onClick={() => void finish(null)}
                  className="btn-secondary px-4 py-2 text-[14px]"
                >
                  {t('tasks.signInSkip')}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="px-2 py-2 text-[14px] text-muted hover:text-ink"
                >
                  {t('tasks.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* ---------- BƯỚC 2b: hỏi hạn ---------- */}
          {step === 'deadline' && (
            <div className="mt-3 rounded-2xl border border-line bg-soft p-3.5">
              <p className="text-[14.5px] font-medium">{t('tasks.deadlineTitle')}</p>
              <p className="mt-1 truncate text-[13.5px] text-muted">“{pending}”</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void finish(null)}
                  className="btn-primary px-4 py-2 text-[14px]"
                >
                  {t('tasks.deadlineDaily')}
                </button>

                {/*
                  KHÔNG HỎI NĂM — mặc định năm hiện tại, và ngày đã qua thì tự
                  đẩy sang năm sau (xem dueDateFromDayMonth). Người đặt mục tiêu
                  học thì nghĩ theo "15/3", bắt gõ thêm "2026" là ba lần gõ thừa
                  cho một thông tin đoán được.

                  inputMode="numeric" chứ không phải type="number": type number
                  trên di động vẫn hiện nút tăng/giảm và cho gõ cả "e", "+".
                */}
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={15} className="text-muted" />
                  <input
                    value={day}
                    onChange={(e) => {
                      setDay(e.target.value.replace(/\D/g, '').slice(0, 2))
                      setDateError(false)
                    }}
                    inputMode="numeric"
                    placeholder={t('tasks.day')}
                    aria-label={t('tasks.day')}
                    className="w-[52px] rounded-pill bg-card px-3 py-2 text-center text-[14px] outline-none placeholder:text-muted"
                  />
                  <span className="text-muted">/</span>
                  <input
                    value={month}
                    onChange={(e) => {
                      setMonth(e.target.value.replace(/\D/g, '').slice(0, 2))
                      setDateError(false)
                    }}
                    inputMode="numeric"
                    placeholder={t('tasks.month')}
                    aria-label={t('tasks.month')}
                    onKeyDown={(e) => e.key === 'Enter' && confirmDate()}
                    className="w-[52px] rounded-pill bg-card px-3 py-2 text-center text-[14px] outline-none placeholder:text-muted"
                  />
                  <button
                    type="button"
                    onClick={confirmDate}
                    disabled={day === '' || month === ''}
                    className="btn-secondary px-3 py-2 text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('tasks.deadlineSet')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={cancel}
                  className="px-2 py-2 text-[14px] text-muted hover:text-ink"
                >
                  {t('tasks.cancel')}
                </button>
              </div>

              {dateError && (
                <p className="mt-2 text-[13.5px] text-bad">{t('tasks.dateInvalid')}</p>
              )}
            </div>
          )}

          {/* ---------- BƯỚC 1: gõ mục tiêu ---------- */}
          {step === 'idle' && (
            <form
              onSubmit={submit}
              className="mt-3 flex items-center gap-2 border-t border-line pt-3"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_LEN}
                disabled={full}
                placeholder={full ? `Đủ ${MAX_TASKS} việc rồi` : 'Thêm một mục tiêu…'}
                aria-label={t('tasks.addToday')}
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
          )}
        </>
      )}
    </section>
  )
}

/** Hạn chót cạnh tên việc. Đỏ khi đã trễ, ấm khi còn hôm nay hoặc mai. */
function DuePill({ due }: { due: string }) {
  const left = daysUntil(due)
  const tone =
    left < 0 ? 'bg-bad-soft text-bad' : left <= 1 ? 'bg-warn-soft text-warn' : 'bg-soft text-muted-strong'
  return (
    <span className={`pill flex-none text-[12.5px] ${tone}`} title={`Hạn ${formatDue(due)}`}>
      {formatDue(due)}
    </span>
  )
}
