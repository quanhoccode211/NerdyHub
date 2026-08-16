import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { PageHeader } from '@/components/shell/app-shell'
import {
  ConsentToggle,
  DeleteAccountPanel,
} from '@/components/settings/data-rights-panels'
import { ChevronRightIcon, WarningIcon } from '@/components/shell/icons'
import { prisma } from '@/lib/db'
import { getConsents, CONSENT_META } from '@/lib/auth/consent'
import { PURGE_DELAY_HOURS } from '@/lib/auth/data-rights'
import { CONSENT_PURPOSES } from '@/lib/enums'
import { formatDate, formatDateTime } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Dữ liệu cá nhân',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function DataRightsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/dang-nhap')

  const [user, consents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        birthDate: true,
        isMinor: true,
        guardianConsent: true,
        guardianEmail: true,
        deletedAt: true,
        purgeAfter: true,
        createdAt: true,
        _count: { select: { attempts: true, consents: true } },
      },
    }),
    getConsents(session.user.id),
  ])
  if (!user) redirect('/dang-nhap')

  // Trẻ em chưa có xác nhận giám hộ bị khoá các mục phơi bày ra ngoài (SPEC F6)
  const minorLocked = user.isMinor && !user.guardianConsent

  return (
    <>
      <PageHeader
        title="Dữ liệu cá nhân"
        subtitle="Quyền của bạn theo Nghị định 13/2023/NĐ-CP."
      />

      {minorLocked && (
        <div className="mb-6 flex items-start gap-3 rounded-card bg-amber-soft p-5 text-amber">
          <WarningIcon size={20} />
          <div className="text-[15px] leading-relaxed">
            <p className="font-semibold">Đang chờ xác nhận của người giám hộ</p>
            <p className="mt-1">
              Chúng tôi đã gửi email tới{' '}
              <strong>{user.guardianEmail ?? 'người giám hộ'}</strong>. Trong lúc chờ, bạn{' '}
              <strong>vẫn làm bài và xem kết quả bình thường</strong> — chỉ hai mục
              &ldquo;bảng xếp hạng công khai&rdquo; và &ldquo;email tiếp thị&rdquo; bị khoá.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Consent từng mục đích */}
          <section className="panel p-7">
            <h2 className="text-[21px] font-bold">Sự đồng ý theo từng mục đích</h2>
            <p className="mt-2 mb-5 text-[14.5px] leading-relaxed text-muted-strong">
              Mỗi mục đích là một lựa chọn riêng — không có ô tích gộp. Bật/tắt bất cứ lúc nào,
              thay đổi có hiệu lực ngay.
            </p>

            <div className="flex flex-col gap-3">
              {CONSENT_PURPOSES.map((purpose) => {
                const meta = CONSENT_META[purpose]
                const lockedByAge =
                  minorLocked &&
                  (purpose === 'LEADERBOARD_PUBLIC' || purpose === 'MARKETING_EMAIL')
                return (
                  <ConsentToggle
                    key={purpose}
                    purpose={purpose}
                    title={meta.title}
                    body={meta.body}
                    required={meta.required}
                    granted={consents[purpose]}
                    locked={lockedByAge}
                    lockReason={
                      lockedByAge ? 'Cần xác nhận của người giám hộ mới bật được' : undefined
                    }
                  />
                )
              })}
            </div>
          </section>

          {/* Xoá tài khoản */}
          <section>
            <DeleteAccountPanel
              pendingDeletion={Boolean(user.deletedAt)}
              purgeAfter={user.purgeAfter?.toISOString() ?? null}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="panel p-6">
            <h2 className="text-[18px] font-bold">Tài khoản</h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-[14.5px]">
              <Row label="Email" value={user.email} />
              <Row label="Tên" value={user.name ?? '—'} />
              <Row label="Ngày sinh" value={user.birthDate ? formatDate(user.birthDate) : '—'} />
              <Row label="Dưới 16 tuổi" value={user.isMinor ? 'Có' : 'Không'} />
              {user.isMinor && (
                <Row label="Xác nhận giám hộ" value={user.guardianConsent ? 'Đã có' : 'Chưa có'} />
              )}
              <Row label="Số bài đã làm" value={String(user._count.attempts)} />
              <Row label="Tạo lúc" value={formatDateTime(user.createdAt)} />
            </dl>
          </section>

          <section className="rounded-card bg-lime p-6 text-on-tone">
            <h2 className="text-[18px] font-bold">Xuất dữ liệu</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed">
              Tải về toàn bộ dữ liệu cá nhân của bạn dưới dạng JSON: tài khoản, sự đồng ý, bài
              làm, đáp án, ghi chú và kế hoạch ôn.
            </p>
            <a
              href="/api/user/export"
              download
              className="btn-primary mt-4 w-full justify-center"
            >
              Tải file JSON
            </a>
            <p className="mt-3 text-[13px] leading-relaxed text-on-tone/55">
              Mật khẩu và token truy cập không nằm trong file — chúng không phải dữ liệu bạn
              cung cấp.
            </p>
          </section>

          <section className="panel p-6">
            <h2 className="text-[18px] font-bold">Cam kết xoá</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-strong">
              Yêu cầu xoá có hiệu lực ngay; dữ liệu bị xoá vĩnh viễn sau{' '}
              <strong>{PURGE_DELAY_HOURS} giờ</strong>. Có job nền kiểm chứng đúng mốc này chứ
              không chỉ là lời hứa trong chính sách.
            </p>
            <Link href="/cai-dat" className="btn-ghost mt-4 w-full justify-center">
              Về cài đặt chung
              <ChevronRightIcon size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  )
}
