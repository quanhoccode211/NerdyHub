import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, isGoogleConfigured } from '@/auth'
import { LoginForm } from '@/components/auth/login-form'
import { WarningIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: true },
}

type Props = PageProps<'/dang-nhap'>

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const sp = await searchParams
  // Auth.js chuyển hướng về đây kèm ?error= khi OAuth hỏng
  const oauthError = typeof sp.error === 'string' ? sp.error : null

  return (
    <>
      <h1 className="text-[27px] font-bold">Đăng nhập</h1>
      <p className="mt-1.5 mb-6 text-[15.5px] text-muted-strong">
        Tiếp tục theo dõi tiến độ và điểm số của bạn.
      </p>

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
