import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { ChevronRightIcon, LockIcon, SettingsIcon } from '@/components/shell/icons'
import { optionalUser } from '@/lib/auth/session'
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
 * Trang GIẢI THÍCH các mục đích xử lý dữ liệu theo NĐ 13/2023.
 *
 * Công tắc thật nằm ở /cai-dat/du-lieu và cần đăng nhập — F6 đã xong. Các ô ở đây
 * cố ý chỉ để đọc, và phải nói rõ điều đó: một hàng công tắc trông bấm được nhưng
 * không ghi gì xuống DB còn tệ hơn là không có.
 */
export default async function SettingsPage() {
  const user = await optionalUser()

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
                <div key={p} className="flex items-start gap-4 rounded-2xl bg-card p-4">
                  <div className="min-w-0 flex-1">
                    {/*
                      <h3> chứ không phải <p>: đây là TIÊU ĐỀ của thẻ. Ngoài chuyện
                      đúng ngữ nghĩa, `@layer base` gán font tỉ lệ cho mọi <p> và
                      <li>, nên để là <p> thì tiêu đề mấy thẻ này chạy font khác hẳn
                      tiêu đề mọi thẻ khác trên cùng màn hình.
                    */}
                    <h3 className="flex items-center gap-2 text-[16px] font-semibold">
                      {meta.title}
                      {meta.required && (
                        <span className="pill bg-purple-soft text-purple">Bắt buộc</span>
                      )}
                    </h3>
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
              Đây là bảng mô tả, các ô ở trên chỉ để đọc. Để bật/tắt thật cho tài khoản của
              bạn, mở <Link href="/cai-dat/du-lieu" className="underline underline-offset-2">
                Dữ liệu &amp; quyền riêng tư
              </Link>.
            </span>
          </p>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="panel p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-soft text-purple">
              <SettingsIcon size={22} />
            </span>
            <h2 className="mt-4 text-[18px] font-bold">Quyền của bạn</h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[14.5px] leading-relaxed text-muted-strong">
              <li>Đăng ký / đăng nhập bằng email hoặc Google</li>
              <li>Xác minh tuổi, và xác nhận của người giám hộ nếu dưới 16</li>
              <li>Xuất toàn bộ dữ liệu cá nhân dạng JSON</li>
              <li>Xoá tài khoản: ẩn ngay, xoá hẳn sau 48 giờ</li>
            </ul>
            <Link href="/cai-dat/du-lieu" className="btn-secondary mt-4 w-full">
              Mở dữ liệu &amp; quyền riêng tư
              <ChevronRightIcon size={15} />
            </Link>
          </section>

          {/*
            `text-on-tone` là BẮT BUỘC trên mọi nền pastel đặc: `--color-lime`
            là màu sáng, dùng `--color-ink` qua nó vẫn an toàn về tương phản.
          */}
          <section className="rounded-card bg-lime p-6 text-on-tone">
            <h2 className="text-[18px] font-bold">Dữ liệu hiện tại của bạn</h2>
            {/* Hỏi phiên đăng nhập thật thay vì khẳng định cứng: nói với người đã
                đăng nhập rằng họ "đang dùng ở chế độ khách" là nói sai. */}
            <p className="mt-2 text-[14.5px] leading-relaxed">
              {user
                ? 'Bài làm của bạn được lưu vào tài khoản này, không phụ thuộc trình duyệt đang dùng.'
                : 'Bạn đang dùng ở chế độ khách. Bài làm gắn với một cookie phiên trong trình duyệt này, không gắn với danh tính cá nhân nào.'}
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
