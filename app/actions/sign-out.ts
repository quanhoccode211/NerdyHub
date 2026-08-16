'use server'

import { signOut } from '@/auth'
import { clearGuestId } from '@/lib/session'

export async function signOutAction() {
  /*
    Xoá cookie khách TRƯỚC khi thoát phiên.
    `guest_id` sống một năm và không đổi theo lần đăng nhập. Giữ lại thì phiên
    khách kế tiếp trên cùng máy thừa kế đúng danh tính cũ — cộng với nhánh khách
    của `ownsAttempt`, người tiếp theo mở được bài của người vừa đăng xuất.
  */
  await clearGuestId()
  await signOut({ redirectTo: '/' })
}
