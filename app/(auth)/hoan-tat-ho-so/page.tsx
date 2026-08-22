import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CompleteProfileForm } from '@/components/auth/complete-profile-form'

export const metadata: Metadata = {
  title: 'Hoàn tất hồ sơ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function CompleteProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/dang-nhap')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { birthDate: true, name: true },
  })
  /*
    Token hợp lệ nhưng tài khoản đã biến mất (job xoá cứng, hoặc DB dev dựng lại).
    Trước đây nhánh này im lặng render form, rồi `completeProfileAction` mới đâm vào
    `prisma.user.update()` và ném lỗi Prisma thô ra màn hình. Bắt ở đây thì người
    dùng nhận được đúng thứ họ cần: lời mời đăng nhập lại.
  */
  if (!user) redirect('/dang-nhap?phien=het-han')

  // Đã có ngày sinh thì không cần hỏi lại
  if (user.birthDate) redirect('/dashboard')

  return (
    <>
      <h1 className="text-[27px] font-bold">Còn một bước nữa</h1>
      <p className="mt-1.5 mb-6 text-[15.5px] leading-relaxed text-muted-strong">
        {user.name ? `Chào ${user.name}. ` : ''}
        Google không cung cấp ngày sinh, nhưng theo Nghị định 13/2023/NĐ-CP chúng tôi bắt buộc
        phải xác minh tuổi trước khi xử lý dữ liệu của bạn.
      </p>
      <CompleteProfileForm />
    </>
  )
}
