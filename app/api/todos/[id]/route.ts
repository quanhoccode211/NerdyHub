import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { patchTodoSchema } from '@/lib/api-schemas'
import { getIdentity } from '@/lib/session'

type Ctx = { params: Promise<{ id: string }> }

/**
 * `updateMany` / `deleteMany` với `where: { id, userId }` chứ không phải
 * `findUnique` rồi kiểm quyền ở tầng ứng dụng: điều kiện chủ sở hữu nằm TRONG
 * câu lệnh ghi nên không có khe hở nào giữa lúc đọc và lúc ghi, và một lần quên
 * `if` là không ghi được gì thay vì ghi lên việc của người khác.
 *
 * `count === 0` gộp cả "không có" lẫn "không phải của bạn" thành 404. Đó là
 * chủ ý: trả 403 là xác nhận id đó có tồn tại.
 */

/** PATCH /api/todos/[id] — đổi trạng thái xong `{ done }` */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { userId } = await getIdentity()
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const parsed = patchTodoSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const { count } = await prisma.todo.updateMany({
    where: { id, userId },
    data: { done: parsed.data.done },
  })
  if (count === 0) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

/** DELETE /api/todos/[id] */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { userId } = await getIdentity()
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const { count } = await prisma.todo.deleteMany({ where: { id, userId } })
  if (count === 0) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
