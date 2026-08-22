'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useSession } from 'next-auth/react'
import { MAX_TASKS, type Todo } from '@/lib/todos'

/**
 * Kho To-do dùng chung cho widget "To-do list" và pill nhắc ở góc màn hình.
 *
 * HAI ĐƯỜNG LƯU, một giao diện:
 *   - đã đăng nhập  -> /api/todos, còn nguyên sau khi dọn trình duyệt
 *   - khách         -> localStorage, mất khi dọn trình duyệt
 *
 * Đó chính là câu mà ô gợi ý đăng nhập đang nói với người dùng, nên nếu sau này
 * ai bỏ nhánh server đi thì phải bỏ luôn câu gợi ý — hứa một chỗ lưu không tồn
 * tại còn tệ hơn không hứa gì.
 *
 * State nằm ở tầng MODULE chứ không trong một Context: pill sống trong AppShell
 * còn widget nằm sâu trong trang Tổng quan, dựng Provider bọc cả hai nghĩa là
 * kéo state lên tận layout cho đúng hai chỗ đọc. Module thì cả hai import là
 * xong, và danh sách sống qua các lần đổi tab y như bộ nhớ đệm của ngôi sao.
 */

const KEY = 'daily-tasks-v2'
/** Khoá của bản chỉ-có-việc-trong-ngày, đọc một lần rồi bỏ — xem loadLocal(). */
const LEGACY_KEY = 'daily-tasks-v1'

type Persisted = { date: string; todos: Todo[] }

/** Ngày local dạng YYYY-MM-DD. Không dùng toISOString: nó quy về UTC, sau 7h tối
 *  giờ Việt Nam sẽ nhảy sang ngày hôm sau và dọn danh sách sớm mất nửa buổi. */
function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadLocal(): Todo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      /* Bản v1 chỉ có {id,text,done}. Nâng lên tại chỗ để người đang dùng dở
         không mất danh sách vì một lần đổi định dạng. */
      const old = localStorage.getItem(LEGACY_KEY)
      if (!old) return []
      const v1 = JSON.parse(old) as { date: string; tasks?: { id: string; text: string; done: boolean }[] }
      const todos = (v1.tasks ?? []).map((t) => ({ ...t, dueDate: null }))
      saveLocal(todos)
      localStorage.removeItem(LEGACY_KEY)
      return todos
    }
    const saved = JSON.parse(raw) as Persisted
    if (!Array.isArray(saved.todos)) return []
    if (saved.date === today()) return saved.todos

    /*
      SANG NGÀY MỚI: dọn việc đã xong, giữ việc còn nợ.

      Chỉ áp cho việc TRONG NGÀY (`dueDate === null`). Một mục tiêu có hạn 20/3
      mà bị dọn đi vì hôm nay đã tick xong nó thì… đúng, nó xong rồi, dọn được.
      Nhưng việc CHƯA xong có hạn thì đương nhiên phải sống qua đêm — nhánh
      filter dưới đây giữ cả hai loại chưa xong nên không cần tách.
    */
    return saved.todos.filter((t) => !t.done)
  } catch {
    return []
  }
}

function saveLocal(todos: Todo[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: today(), todos } satisfies Persisted))
  } catch {
    /* hết quota — không đáng làm hỏng cả widget */
  }
}

// ---------------------------------------------------------------- state chung

type Snapshot = { todos: Todo[]; ready: boolean }

/*
  Ảnh chụp là một object BẤT BIẾN, thay nguyên cái mỗi lần đổi.
  `useSyncExternalStore` so sánh bằng `Object.is`, nên sửa tại chỗ rồi báo thay
  đổi thì React thấy y hệt cái cũ và không vẽ lại.
*/
let snapshot: Snapshot = { todos: [], ready: false }
/** Ảnh chụp lúc render ở SERVER — phải là hằng, trả object mới mỗi lần gọi là
 *  vòng lặp render vô tận. Server không có localStorage nên luôn rỗng. */
const SERVER_SNAPSHOT: Snapshot = { todos: [], ready: false }

let loadedFor: 'guest' | 'user' | null = null
const listeners = new Set<() => void>()

function emit(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function setAll(next: Todo[], authed: boolean) {
  if (!authed) saveLocal(next)
  emit({ todos: next })
}

async function pull(authed: boolean) {
  if (!authed) {
    /* Ghi lại NGAY, kể cả khi không có gì đổi. `loadLocal()` chỉ dọn danh sách
       trong bộ nhớ, còn localStorage vẫn mang ngày cũ — để nguyên thì có một
       khe hở: mở tab lúc 23h59, qua nửa đêm mới tick một việc, lần ghi sau sẽ
       đóng dấu ngày hôm nay lên nguyên danh sách của hôm qua kể cả các việc đã
       xong. Ghi lại ở đây là idempotent và bịt hẳn khe đó. */
    const local = loadLocal()
    saveLocal(local)
    emit({ todos: local, ready: true })
    return
  }
  /*
    ĐĂNG NHẬP XONG THÌ MANG DANH SÁCH Ở MÁY LÊN, rồi mới đọc về.

    Người ta gõ vài việc lúc còn là khách, thấy ô gợi ý đăng nhập, rồi đăng
    nhập — nếu vào tới nơi mà danh sách trống thì lời gợi ý đó vừa nuốt mất đúng
    thứ nó hứa sẽ giữ. Xoá localStorage sau khi đẩy lên nên chạy lại không nhân
    đôi.
  */
  const local = loadLocal()
  if (local.length > 0) {
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ import: local.map(({ text, done, dueDate }) => ({ text, done, dueDate })) }),
    }).catch(() => null)
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* không xoá được thì lần sau đẩy lên lại — server đã có trần MAX_TASKS */
    }
  }

  const res = await fetch('/api/todos').catch(() => null)
  if (!res?.ok) {
    /* Mạng hỏng hay 401: vẫn phải bật `ready`, không thì widget đứng vĩnh viễn
       ở khung xương và người dùng không thêm được việc nào. */
    emit({ ready: true })
    return
  }
  const data: { todos?: Todo[] } = await res.json()
  emit({ todos: data.todos ?? [], ready: true })
}

/** Danh sách hiện tại + các phép sửa. `authed` quyết định đường lưu. */
export function useTodos() {
  const { status } = useSession()
  const authed = status === 'authenticated'
  const { todos, ready } = useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT)

  useEffect(() => {
    /* `status` bắt đầu ở 'loading' — nạp lúc đó là đoán sai đường lưu và ghi
       danh sách của người đã đăng nhập vào localStorage của máy. */
    if (status === 'loading') return
    const want = authed ? 'user' : 'guest'
    /* Đã nạp cho đúng danh tính này rồi thì thôi — `ready` nằm trong ảnh chụp
       dùng chung nên component thứ hai (pill nhắc) không phải nạp lại. */
    if (loadedFor === want) return
    loadedFor = want
    void pull(authed)
  }, [status, authed])

  return {
    todos,
    ready,
    authed,
    authKnown: status !== 'loading',
    full: todos.filter((t) => !t.done).length >= MAX_TASKS,

    async add(text: string, dueDate: string | null) {
      if (authed) {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text, dueDate }),
        })
        if (!res.ok) return false
        const data: { todos?: Todo[] } = await res.json()
        setAll(data.todos ?? todos, true)
        return true
      }
      setAll([...todos, { id: crypto.randomUUID(), text, done: false, dueDate }], false)
      return true
    },

    async toggle(id: string) {
      const next = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      const done = next.find((t) => t.id === id)?.done ?? false
      setAll(next, authed) // lật ngay, đừng bắt người dùng chờ một vòng mạng
      if (authed) {
        await fetch(`/api/todos/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ done }),
        }).catch(() => null)
      }
    },

    async remove(id: string) {
      setAll(
        todos.filter((t) => t.id !== id),
        authed,
      )
      if (authed) await fetch(`/api/todos/${id}`, { method: 'DELETE' }).catch(() => null)
    },
  }
}
