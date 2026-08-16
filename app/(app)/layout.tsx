import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { profileIsComplete } from '@/lib/auth/session'
import { AppShell } from '@/components/shell/app-shell'

/**
 * Các trang trong nhóm này vốn đã động (gắn với người dùng cụ thể), nên gọi
 * `auth()` ở đây không làm mất tối ưu gì.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Đăng nhập bằng Google nhưng chưa có ngày sinh -> chưa xác minh được tuổi,
  // chặn lại trước khi cho dùng tiếp (NĐ 13/2023).
  //
  // Kiểm qua `profileIsComplete` chứ KHÔNG đọc thẳng session.user.profileComplete:
  // cờ đó nằm trong JWT nên có thể cũ hơn database, và /hoan-tat-ho-so lại quyết
  // định dựa trên database. Hai nguồn lệch nhau là thành vòng lặp chuyển hướng.
  if (session?.user && !(await profileIsComplete(session.user))) {
    redirect('/hoan-tat-ho-so')
  }

  return <AppShell>{children}</AppShell>
}
