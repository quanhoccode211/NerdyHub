import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, isGoogleConfigured } from '@/auth'
import { userStillExists } from '@/lib/auth/session'
import { LoginForm } from '@/components/auth/login-form'
import { WarningIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: true },
}

type Props = PageProps<'/dang-nhap'>

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth()
  /*
    Chỉ đá sang dashboard khi phiên TRỎ TỚI MỘT TÀI KHOẢN CÓ THẬT.

    Thiếu vế thứ hai là một vòng lặp chuyển hướng kín: phiên cũ còn hạn nên trang
    này đẩy sang /dashboard, `requireUser` thấy tài khoản đã bị xoá nên đẩy ngược
    về đây, và cứ thế. Đây đúng là hình dạng của lỗi vòng lặp giữa /dashboard và
    /hoan-tat-ho-so mà `profileIsComplete` đã phải xử lý một lần rồi — cùng một bài
    học: hai trang đọc hai nguồn khác nhau thì phải cùng hỏi DB mới thoát ra được.
  */
  if (session?.user?.id && (await userStillExists(session.user.id))) redirect('/dashboard')

  const sp = await searchParams
  // Auth.js chuyển hướng về đây kèm ?error= khi OAuth hỏng
  const oauthError = typeof sp.error === 'string' ? sp.error : null
  // Token còn hạn nhưng tài khoản không còn — xem lib/auth/session.ts
  const staleSession = sp.phien === 'het-han'

  return (
    <>
      <h1 className="text-[27px] font-bold">Đăng nhập</h1>
      <p className="mt-1.5 mb-6 text-[15.5px] text-muted-strong">
        Tiếp tục theo dõi tiến độ và điểm số của bạn.
      </p>

      {staleSession && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-soft px-4 py-3 text-[14px] leading-relaxed text-amber">
          <WarningIcon size={16} />
          <span>
            Phiên đăng nhập cũ không còn hiệu lực vì tài khoản gắn với nó đã bị xoá.
            Bạn đăng nhập lại giúp nhé.
          </span>
        </p>
      )}

      {oauthError && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-red-soft px-4 py-3 text-[14px] leading-relaxed text-red">
          <WarningIcon size={16} />
          <span>
            Đăng nhập Google không thành công ({oauthError}). Nếu bạn vừa cấu hình Google
            Cloud, kiểm tra lại redirect URI theo{' '}
            <code className="font-mono">docs/google-oauth-setup.md</code>.
          </span>
        </p>
      )}

      <LoginForm googleEnabled={isGoogleConfigured()} />
    </>
  )
}
