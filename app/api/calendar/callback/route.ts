import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { setConsent } from '@/lib/auth/consent'
import { exchangeCode, saveConnection } from '@/lib/calendar/google'
import { STATE_COOKIE } from '../connect/route'

/**
 * GET /api/calendar/callback — Google chuyển hướng về đây sau màn hình xin quyền.
 *
 * Mọi nhánh hỏng đều quay về /lich-on kèm mã lỗi trên query, không bao giờ trả
 * JSON trần: đây là trang người dùng đang xem chứ không phải lời gọi API.
 * Cũng KHÔNG in chi tiết lỗi của Google ra URL — đường dẫn nằm trong lịch sử
 * trình duyệt và log máy chủ.
 */
function back(code?: string) {
  const url = new URL('/lich-on', process.env.NEXT_PUBLIC_SITE_URL)
  if (code) url.searchParams.set('loi', code)
  else url.searchParams.set('ok', '1')
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/dang-nhap', process.env.NEXT_PUBLIC_SITE_URL))
  }

  const store = await cookies()
  const expected = store.get(STATE_COOKIE)?.value
  // Dùng một lần: xoá ngay bất kể kết quả ra sao
  store.delete(STATE_COOKIE)

  const params = request.nextUrl.searchParams

  // Người dùng bấm "Huỷ" ở màn hình của Google — không phải lỗi, đừng doạ họ
  if (params.get('error')) return back('tu-choi')

  const state = params.get('state')
  if (!expected || !state || state !== expected) return back('state-sai')

  const code = params.get('code')
  if (!code) return back('thieu-code')

  try {
    const tokens = await exchangeCode(code)

    /*
      Không có refresh token thì kết nối chết sau một giờ. Xảy ra khi thiếu
      access_type=offline/prompt=consent, hoặc khi Google đã cấp cho app này
      trước đó và không phát lại. Thà báo hỏng ngay còn hơn để người dùng tưởng
      đã xong rồi mai vào thấy mất kết nối.
    */
    if (!tokens.refresh_token) return back('thieu-refresh-token')

    await saveConnection(session.user.id, tokens, tokens.refresh_token)

    // NĐ 13/2023: ghi nhận đồng ý cho đúng mục đích, kèm IP/user-agent
    await setConsent(session.user.id, 'CALENDAR_ACCESS', true)

    return back()
  } catch {
    return back('doi-token-that-bai')
  }
}
