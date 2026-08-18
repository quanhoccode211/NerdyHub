import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, isGoogleConfigured } from '@/auth'
import { RegisterForm } from '@/components/auth/register-form'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản để lưu tiến độ luyện đề và theo dõi điểm số qua thời gian.',
  robots: { index: false, follow: true },
}

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')
  const t = await getT()

  return (
    <>
      <h1 className="text-[27px] font-bold">{t('register.title')}</h1>
      <p className="mt-1.5 mb-6 text-[15.5px] text-muted-strong">
        {t('register.subtitle')}
      </p>
      <RegisterForm googleEnabled={isGoogleConfigured()} />
    </>
  )
}
