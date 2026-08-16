'use server'

import { revalidatePath } from 'next/cache'
import { clearGuestId } from '@/lib/session'

/**
 * Dọn danh tính KHÁCH. Phiên đăng nhập do `signOut` phía client lo — xem app-shell.
 *
 * Vì sao tách đôi thay vì gọi `signOut` của Auth.js ngay trong server action:
 * `useSession()` giữ một bản sao phiên TRONG BỘ NHỚ client. Server action xoá được
 * cookie nhưng không với tới bản sao đó, nên avatar và tên người vừa thoát vẫn nằm
 * nguyên trên header — trông đúng như đăng xuất không ăn thua. `signOut` của
 * `next-auth/react` xoá cả hai và tải lại trang, nên nó phải là bước cuối.
 *
 * `guest_id` thì ngược lại: cookie httpOnly, client không đụng tới được, buộc phải
 * xoá ở server. Nó sống một năm và không đổi theo lần đăng nhập — giữ lại thì phiên
 * khách kế tiếp trên cùng máy thừa kế đúng danh tính cũ, và qua nhánh khách của
 * `ownsAttempt`, người tiếp theo mở được bài của người vừa đăng xuất.
 */
export async function clearGuestIdentityAction() {
  await clearGuestId()
  // Dọn Router Cache: các trang đã render lúc còn đăng nhập không được phát lại
  revalidatePath('/', 'layout')
}
