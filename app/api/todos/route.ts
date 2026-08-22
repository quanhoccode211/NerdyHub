import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createTodoSchema, importTodosSchema } from '@/lib/api-schemas'
import { getIdentity } from '@/lib/session'
import { LIMITS, rateLimit } from '@/lib/rate-limit'
import { MAX_TASKS, type Todo } from '@/lib/todos'

/**
 * To-do list của người ĐÃ ĐĂNG NHẬP.
 *
 * Khách vãng lai không đi qua đây — danh sách của họ ở localStorage, xem
 * components/dashboard/daily-tasks.tsx. Mọi route dưới đây trả 401 cho khách
 * chứ không lặng lẽ trả mảng rỗng: widget cần phân biệt "chưa đăng nhập" với
 * "đã đăng nhập nhưng chưa có việc nào" để biết có hiện ô gợi ý đăng nhập không.
 */

function toDto(t: { id: string; text: string; done: boolean; dueDate: Date | null }): Todo {
  return { id: t.id, text: t.text, done: t.done, dueDate: t.dueDate?.toISOString() ?? null }
}

/*
  THỨ TỰ: việc chưa xong lên trước, rồi tới hạn gần nhất, rồi mới tới cũ nhất.

  Việc không có hạn (`dueDate` null, tức việc trong ngày) phải nằm SAU việc có
  hạn — `nulls: 'last'` là bắt buộc, Postgres mặc định xếp NULL cuối ở `asc`
  nhưng khai ra thì đổi `asc` thành `desc` sau này không âm thầm lật cả nhóm đó
  lên đầu.
*/
const ORDER = [
  { done: 'asc' as const },
  { dueDate: { sort: 'asc' as const, nulls: 'last' as const } },
  { createdAt: 'asc' as const },
]

/** GET /api/todos */
export async function GET() {
  const { userId } = await getIdentity()
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  /*
    SANG NGÀY MỚI THÌ DỌN VIỆC TRONG NGÀY ĐÃ XONG — giống hệt nhánh localStorage
    của khách (xem loadLocal() trong components/todos/todo-store.ts). Hai đường
    lưu phải cư xử như nhau, nếu không thì đăng nhập lại đổi luôn cách widget
    hoạt động, và người dùng đọc ra là một cái lỗi.

    CHỈ dọn `dueDate: null` (việc trong ngày). Mục tiêu dài hạn đã xong thì giữ
    lại: nó là một cái mốc, không phải một dòng gạch đầu dòng của hôm qua.

    Xoá ở đường ĐỌC nghe ngược, nhưng đây là chỗ duy nhất chắc chắn chạy: không
    có tiến trình định kỳ nào trong dự án (xem "Chưa có" ở README), mà không dọn
    thì sau một tháng danh sách toàn dấu tích cũ.
  */
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  await prisma.todo.deleteMany({
    where: { userId, done: true, dueDate: null, createdAt: { lt: startOfToday } },
  })

  const rows = await prisma.todo.findMany({ where: { userId }, orderBy: ORDER })
  return NextResponse.json({ todos: rows.map(toDto) })
}

/**
 * POST /api/todos — thêm một việc `{ text, dueDate? }`, hoặc nhập cả danh sách
 * của khách `{ import: [...] }` khi họ vừa đăng nhập.
 */
export async function POST(request: NextRequest) {
  const { userId } = await getIdentity()
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const limit = rateLimit(`todo:${userId}`, LIMITS.todo)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Bạn thao tác quá nhanh, thử lại sau ít giây.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  const body = await request.json().catch(() => null)

  /* NHẬP TỪ MÁY KHÁCH — chạy đúng một lần, ngay sau khi đăng nhập. */
  const asImport = importTodosSchema.safeParse(body)
  if (asImport.success) {
    const room = MAX_TASKS - (await prisma.todo.count({ where: { userId, done: false } }))
    if (room <= 0) return NextResponse.json({ todos: await list(userId) })

    await prisma.todo.createMany({
      data: asImport.data.import.slice(0, room).map((t) => ({
        userId,
        text: t.text,
        done: t.done,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
      })),
    })
    return NextResponse.json({ todos: await list(userId) })
  }

  const parsed = createTodoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  /*
    TRẦN 5 VIỆC ÁP Ở SERVER, không chỉ ở nút bấm.

    Nút "+" tự tắt khi đủ 5, nhưng đó là trạng thái của một tab. Mở hai tab, mỗi
    tab thấy 4 việc, cả hai đều cho thêm — trần chỉ có thật khi nó nằm ở đây.
    Đếm việc CHƯA XONG: việc đã tick không còn chiếm chỗ trong đầu ai cả.
  */
  const pending = await prisma.todo.count({ where: { userId, done: false } })
  if (pending >= MAX_TASKS) {
    return NextResponse.json({ error: `Đủ ${MAX_TASKS} việc rồi` }, { status: 409 })
  }

  await prisma.todo.create({
    data: {
      userId,
      text: parsed.data.text,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  })
  return NextResponse.json({ todos: await list(userId) })
}

async function list(userId: string): Promise<Todo[]> {
  const rows = await prisma.todo.findMany({ where: { userId }, orderBy: ORDER })
  return rows.map(toDto)
}
