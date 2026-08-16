import Link from 'next/link'
import { LogoMark } from '@/components/shell/icons'

/**
 * Khung riêng cho trang giới thiệu.
 *
 * KHÔNG dùng AppShell: trang này đứng trước khi vào ứng dụng nên không có rail
 * điều hướng dạng pill, cũng không có nút menu — chỉ tên thương hiệu, phần còn
 * lại dẫn vào ứng dụng qua nút CTA ở cuối hero.
 *
 * `theme-light` khoá trang này ở giao diện sáng, xem globals.css.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    // md trở lên khoá đúng chiều cao màn hình — hero phải xem hết được mà không
    // cuộn. Mobile vẫn min-h-screen vì ở đó cuộn là chuyện bình thường.
    <div className="theme-light flex min-h-screen justify-center p-[10px] md:h-screen">
      {/* lg:py-6 chứ không py-9: hero khoá đúng một màn hình, 24px đó trả về cho
          cụm minh hoạ — xem ghi chú trong app/(landing)/page.tsx. */}
      <div className="shell-card flex w-full flex-col px-5 py-5 md:px-9 md:py-7 lg:px-12 lg:py-6">
        <header className="flex flex-none items-center">
          <Link href="/" aria-label="Nerdy Hub — trang chủ" className="flex items-center gap-2.5">
            <LogoMark size={34} />
            <span className="wordmark text-[20px]">Nerdy Hub</span>
          </Link>
        </header>

        {/* min-h-0: cụm minh hoạ bên trong co giãn bằng flex-1, mà flex item mặc
            định là `min-height: auto` — thiếu min-h-0 ở BẤT KỲ mắt xích nào trên
            chuỗi thì cả chuỗi không chịu co và trang tràn khỏi h-screen. */}
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
