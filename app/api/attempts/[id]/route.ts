import { NextResponse } from 'next/server'
import { loadExamRoom } from '@/lib/attempt-service'
import { prisma } from '@/lib/db'
import { getIdentity, ownsAttempt } from '@/lib/session'

/**
 * GET /api/attempts/[id] — lấy trạng thái để khôi phục phiên (SPEC F2.5).
 * Trang phòng thi nạp dữ liệu qua Server Component; endpoint này dành cho
 * client cần đồng bộ lại sau khi mất kết nối dài.
 */
export async function GET(_req: Request, ctx: RouteContext<'/api/attempts/[id]'>) {
  const { id } = await ctx.params
  const { userId, guestId } = await getIdentity()

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    select: { userId: true, guestId: true, status: true },
  })
  if (!attempt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!ownsAttempt(attempt, { userId, guestId })) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // reveal chỉ được bật khi đã nộp — loadExamRoom tự kiểm tra lần nữa
  const data = await loadExamRoom(id, attempt.status === 'SUBMITTED')
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(data)
}
