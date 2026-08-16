import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { ChevronRightIcon, LockIcon, SettingsIcon } from '@/components/shell/icons'
import { CONSENT_PURPOSES } from '@/lib/enums'

export const metadata: Metadata = {
  title: 'Cài đặt',
  robots: { index: false, follow: false },
}

const PURPOSE_LABELS: Record<string, { title: string; body: string; required?: boolean }> = {
  SERVICE_ESSENTIAL: {
    title: 'Vận hành dịch vụ',
    body: 'Lưu bài làm, chấm điểm, khôi phục phiên thi. Bắt buộc để dùng được sản phẩm.',
    required: true,
  },
  ANALYTICS: {
    title: 'Phân tích sử dụng',
    body: 'Thống kê ẩn danh giúp cải thiện chất lượng đề và trải nghiệm phòng thi.',
  },
  MARKETING_EMAIL: {
    title: 'Email tiếp thị',
    body: 'Nhận thông báo về đề mới và tính năng mới.',
  },
  LEADERBOARD_PUBLIC: {
    title: 'Hiện tên trên bảng xếp hạng',
    body: 'Cho phép hiển thị tên bạn công khai khi so sánh thành tích.',
  },
  CALENDAR_ACCESS: {
    title: 'Kết nối Google Calendar',
    body: 'Tạo lịch ôn riêng trong tài khoản Google của bạn.',
  },
}

/**
 * F6 (Auth.js, xác minh tuổi, quản lý consent, xuất/xoá dữ liệu) thuộc giai đoạn sau.
 * Trang này mô tả đúng thiết kế tuân thủ NĐ 13/2023 sẽ được nối vào, không phải
 * form giả — các ô đều bị vô hiệu hoá để không tạo cảm giác đã hoạt động.
 */
export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Cài đặt"
        subtitle="Tài khoản và quyền riêng tư theo Nghị định 13/2023/NĐ-CP."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="panel p-7">
          <h2 className="text-[21px] font-bold">Sự đồng ý theo từng mục đích</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-strong">
            NĐ 13/2023 yêu cầu tách bạch từng mục đích, không gộp chung một ô tích. Dưới đây là các
            mục đích đã được định nghĩa sẵn trong schema.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {CONSENT_PURPOSES.map((p) => {
              const meta = PURPOSE_LABELS[p]
              return (
                <div key={p} className="flex items-start gap-4 rounded-2xl bg-white p-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[16px] font-semibold">
                      {meta.title}
                      {meta.required && (
                        <span className="pill bg-purple-soft text-purple">Bắt buộc</span>
                      )}
                    </p>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{meta.body}</p>
                  </div>
                  <span
                    className={`mt-1 flex h-6 w-11 flex-none items-center rounded-full px-0.5 ${
                      meta.required ? 'bg-purple' : 'bg-line'
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        meta.required ? 'translate-x-5' : ''
                      }`}
                    />
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-soft p-4 text-[14px] leading-relaxed text-amber">
            <LockIcon size={16} />
            <span>
              Các công tắc này chưa hoạt động: cần Auth.js và tài khoản người dùng thật trước. Bảng{' '}
              <code className="font-mono">Consent</code> đã sẵn sàng trong schema.
            </span>
          </p>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="panel p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-soft text-purple">
              <SettingsIcon size={22} />
            </span>
            <h2 className="mt-4 text-[18px] font-bold">Còn thiếu ở giai đoạn này</h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[14.5px] leading-relaxed text-muted-strong">
              <li>Đăng ký / đăng nhập (Auth.js + Google OAuth)</li>
              <li>Bắt buộc nhập ngày sinh, xác minh dưới 16 tuổi</li>
              <li>Xác nhận của người giám hộ qua email</li>
              <li>Xuất toàn bộ dữ liệu cá nhân dạng JSON</li>
              <li>Xoá tài khoản: soft delete ngay, hard delete sau 48 giờ</li>
            </ul>
          </section>

          <section className="rounded-card bg-lime p-6">
            <h2 className="text-[18px] font-bold">Dữ liệu hiện tại của bạn</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed">
              Bạn đang dùng ở chế độ khách. Bài làm gắn với một cookie phiên trong trình duyệt này,
              không gắn với danh tính cá nhân nào.
            </p>
            <Link href="/bai-lam" className="btn-ghost mt-4 w-full justify-center">
              Xem bài đã làm
              <ChevronRightIcon size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  )
}
