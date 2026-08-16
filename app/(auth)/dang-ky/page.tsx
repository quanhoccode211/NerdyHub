import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, isGoogleConfigured } from '@/auth'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản để lưu tiến độ luyện đề và theo dõi điểm số qua thời gian.',
  robots: { index: false, follow: true },
}

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <>
      <h1 className="text-[27px] font-bold">Tạo tài khoản</h1>
      <p className="mt-1.5 mb-6 text-[15.5px] text-muted-strong">
        Bài bạn đã làm ở chế độ khách sẽ được giữ lại và gộp vào tài khoản này.
      </p>
      <RegisterForm googleEnabled={isGoogleConfigured()} />
    </>
  )
}
