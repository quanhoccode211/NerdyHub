import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { exportUserData } from '@/lib/auth/data-rights'

/**
 * GET /api/user/export — xuất toàn bộ dữ liệu cá nhân dạng JSON (SPEC F6).
 * Trả về dưới dạng file tải xuống để người dùng lưu lại được.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const data = await exportUserData(session.user.id)
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="du-lieu-ca-nhan-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
