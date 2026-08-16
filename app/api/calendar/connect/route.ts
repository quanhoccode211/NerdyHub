import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { buildAuthUrl, isCalendarConfigured } from '@/lib/calendar/google'

/**
 * GET /api/calendar/connect — mở màn hình xin quyền của Google.
 *
 * `state` là token ngẫu nhiên đặt song song vào cookie httpOnly; callback so lại
 * hai giá trị. Thiếu bước này thì kẻ tấn công dụ được người dùng bấm vào một
 * callback dựng sẵn và gắn LỊCH CỦA KẺ TẤN CÔNG vào tài khoản nạn nhân (CSRF).
 */

export const STATE_COOKIE = 'calendar_oauth_state'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/dang-nhap', process.env.NEXT_PUBLIC_SITE_URL))
  }

  if (!isCalendarConfigured()) {
    return NextResponse.redirect(
      new URL('/lich-on?loi=chua-cau-hinh', process.env.NEXT_PUBLIC_SITE_URL),
    )
  }

  const state = randomBytes(32).toString('base64url')
  const store = await cookies()
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax', // 'lax' chứ không 'strict': cookie phải sống sót cú chuyển hướng từ Google về
    path: '/',
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === 'production',
  })

  return NextResponse.redirect(buildAuthUrl(state))
}
