import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { CheckIcon, WarningIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Xác nhận của người giám hộ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = PageProps<'/xac-nhan-giam-ho'>

type Outcome = 'ok' | 'already' | 'expired' | 'invalid'

/**
 * Người giám hộ bấm link trong email để xác nhận (NĐ 13/2023 Điều 20).
 *
 * Xác nhận được thực hiện ngay khi mở trang. Đây là hành động do người giám hộ
 * chủ động khởi tạo bằng cách bấm link trong email gửi riêng cho họ, và chỉ mở
 * thêm quyền chứ không xoá gì — nên không cần thêm một bước bấm nút nữa.
 */
async function confirm(token: string): Promise<{ outcome: Outcome; childName?: string }> {
  const row = await prisma.guardianConsentToken.findUnique({ where: { token } })
  if (!row) return { outcome: 'invalid' }

  const user = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { name: true, guardianConsent: true },
  })
  if (!user) return { outcome: 'invalid' }

  if (row.confirmedAt || user.guardianConsent) {
    return { outcome: 'already', childName: user.name ?? undefined }
  }
  if (row.expires.getTime() < Date.now()) {
    return { outcome: 'expired', childName: user.name ?? undefined }
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null

  await prisma.$transaction([
    prisma.guardianConsentToken.update({
      where: { token },
      data: { confirmedAt: new Date(), ipAddress: ip },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { guardianConsent: true },
    }),
  ])

  return { outcome: 'ok', childName: user.name ?? undefined }
}

export default async function GuardianConfirmPage({ searchParams }: Props) {
  const sp = await searchParams
  const token = typeof sp.token === 'string' ? sp.token : ''

  const { outcome, childName } = token
    ? await confirm(token)
    : { outcome: 'invalid' as Outcome, childName: undefined }

  const content = {
    ok: {
      icon: <CheckIcon size={26} />,
      tone: 'bg-green-soft text-green',
      title: 'Đã xác nhận',
      body: `Cảm ơn bạn. Tài khoản của ${childName ?? 'con bạn'} giờ đã có đầy đủ quyền, bao gồm hiển thị trên bảng xếp hạng công khai nếu bật.`,
    },
    already: {
      icon: <CheckIcon size={26} />,
      tone: 'bg-green-soft text-green',
      title: 'Đã xác nhận từ trước',
      body: 'Liên kết này đã được sử dụng. Không cần làm gì thêm.',
    },
    expired: {
      icon: <WarningIcon size={26} />,
      tone: 'bg-amber-soft text-amber',
      title: 'Liên kết đã hết hạn',
      body: 'Liên kết chỉ có hiệu lực 7 ngày. Hãy nhờ con bạn vào phần Cài đặt và bấm gửi lại email xác nhận.',
    },
    invalid: {
      icon: <WarningIcon size={26} />,
      tone: 'bg-red-soft text-red',
      title: 'Liên kết không hợp lệ',
      body: 'Liên kết sai hoặc đã bị thay thế bằng liên kết mới hơn. Hãy dùng email gần nhất bạn nhận được.',
    },
  }[outcome]

  return (
    <div className="text-center">
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${content.tone}`}
      >
        {content.icon}
      </span>
      <h1 className="mt-5 text-[25px] font-bold">{content.title}</h1>
      <p className="mx-auto mt-3 max-w-[420px] text-[15.5px] leading-relaxed text-muted-strong">
        {content.body}
      </p>

      <div className="mt-6 rounded-card bg-soft p-5 text-left">
        <h2 className="text-[15px] font-semibold">Quyền của bạn với tư cách người giám hộ</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[14px] leading-relaxed text-muted-strong">
          <li>Rút lại sự đồng ý bất cứ lúc nào bằng cách liên hệ với chúng tôi</li>
          <li>Yêu cầu xem hoặc xoá toàn bộ dữ liệu cá nhân của con bạn</li>
          <li>Tài khoản không có quảng cáo và không bán dữ liệu cho bên thứ ba</li>
        </ul>
      </div>

      <Link href="/" className="btn-secondary mt-6 inline-flex">
        Về trang chủ
      </Link>
    </div>
  )
}
