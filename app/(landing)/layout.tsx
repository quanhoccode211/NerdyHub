import Link from 'next/link'
import { BRAND_LOGO_SIZE, LogoMark } from '@/components/shell/icons'
import { BRAND_VT_NAME, PAGE_CONTENT_STYLE } from '@/components/shell/nav-slide'

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
      {/*
        Lề NGANG và lề TRÊN phải trùng khít components/shell/app-shell.tsx —
        con dấu ở góc là thứ duy nhất có mặt ở cả hai khung, nên khung nào rộng
        hơn là nó nhảy ngang đúng bằng khoảng chênh khi người dùng bấm vào ứng
        dụng. Trước đây bên này px-12 còn bên kia px-7: kính nhảy 20px.

        Từ lúc có hiệu ứng trượt thì việc khớp này không còn là chuyện gọn mắt
        nữa: con dấu là MỐC NEO đứng yên giữa lúc mọi thứ khác trượt, lệch một
        chút là nó giật một cái ngay giữa hiệu ứng.

        Lề DƯỚI thì không phải khớp, và cố ý giữ riêng: hero khoá đúng một màn
        hình nên chỗ trống dưới cùng là của cụm minh hoạ — xem ghi chú trong
        app/(landing)/page.tsx.
      */}
      <div className="shell-card flex w-full flex-col px-4 pt-4 pb-5 md:px-6 md:pt-5 md:pb-7 lg:px-7 lg:pb-6">
        {/*
          min-h-11 = đúng chiều cao hàng pill điều hướng của AppShell. Header
          bên này không có pill nào để tự đội chiều cao lên, nên thiếu nó thì
          con dấu nằm cao hơn bên kia 6px dù lề trên đã bằng nhau.
        */}
        <header className="flex min-h-11 flex-none items-center">
          {/* aria-label gánh phần tên thương hiệu: con dấu là ảnh nền qua CSS
              mask nên trình đọc màn hình không đọc ra chữ nào từ nó. */}
          <Link
            href="/"
            aria-label="Nerdy Hub — trang chủ"
            className="flex items-center"
            style={{ viewTransitionName: BRAND_VT_NAME }}
          >
            <LogoMark size={BRAND_LOGO_SIZE} />
          </Link>
        </header>

        {/* min-h-0: cụm minh hoạ bên trong co giãn bằng flex-1, mà flex item mặc
            định là `min-height: auto` — thiếu min-h-0 ở BẤT KỲ mắt xích nào trên
            chuỗi thì cả chuỗi không chịu co và trang tràn khỏi h-screen. */}
        {/* Cùng `view-transition-name` với <main> của AppShell: trình duyệt ghép
            cặp theo TÊN nên hero bên này và nội dung bên kia nối được vào nhau,
            dù hai khung là hai layout chẳng dính dáng gì tới nhau về mặt React. */}
        <main className="flex min-h-0 flex-1 flex-col" style={PAGE_CONTENT_STYLE}>
          {children}
        </main>
      </div>
    </div>
  )
}
