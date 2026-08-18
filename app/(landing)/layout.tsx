import Link from 'next/link'
import { LandingAuth } from '@/components/landing/landing-auth'
import { BRAND_LOGO_SIZE, LogoMark } from '@/components/shell/icons'
import { BRAND_VT_NAME, PAGE_CONTENT_STYLE } from '@/components/shell/nav-slide'

/**
 * Khung riêng cho trang giới thiệu.
 *
 * KHÔNG dùng AppShell: trang này đứng trước khi vào ứng dụng nên không có rail
 * điều hướng dạng pill, cũng không có nút menu — chỉ tên thương hiệu, phần còn
 * lại dẫn vào ứng dụng qua nút CTA ở cuối hero.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    // `min-h-screen`, KHÔNG còn `md:h-screen`.
    //
    // Khoá cũ ghim hero vào đúng một màn hình với lý do "phải xem hết được mà
    // không cuộn". Gỡ đi là cái giá phải trả để phóng to khối minh hoạ: ba ảnh
    // giờ lấp kín bề ngang nên chiều cao là hệ quả của tỉ lệ, chứ không còn co
    // theo phần thừa. Còn khoá thì chúng bị ghim lại đúng phần thừa (229,8px ở
    // 1280x720) và không to lên được chút nào.
    //
    // Hệ quả phải biết: ở màn hình thấp trang cuộn thêm một đoạn. Màn hình cao
    // thì không đổi gì, vì phần thừa vốn đã đủ chỗ.
    //
    // Viền 15px (trước là 10px) — PHẢI khớp con số bên app-shell.tsx, xem ghi
    // chú ở đó. Hai khung lệch nhau bao nhiêu thì con dấu nhảy ngang đúng bấy
    // nhiêu lúc chuyển trang, mà nó là mốc neo đứng yên.
    <div className="flex min-h-screen justify-center p-[15px]">
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
          `--brand-row-height` = chiều cao hàng nav của AppShell, TÍNH RA từ
          chính các số dựng nên hàng đó (xem globals.css). Header bên này không
          có pill nào để tự đội chiều cao lên, nên thiếu nó thì con dấu nằm cao
          hơn bên kia.

          Trước đây chỗ này gõ `min-h-11` (44px) kèm ghi chú "đúng bằng hàng
          pill". Đúng lúc viết, rồi hàng nav nở gấp rưỡi mà con số này nằm im:
          đo được con dấu lệch 14px giữa hai khung, tức nó giật một cái ngay
          giữa hiệu ứng chuyển trang — mà con dấu chính là mốc neo đứng yên.
        */}
        <header className="flex min-h-[var(--brand-row-height)] flex-none items-center justify-between gap-4">
          {/* aria-label gánh phần tên thương hiệu: con dấu là ảnh nền qua CSS
              mask nên trình đọc màn hình không đọc ra chữ nào từ nó. */}
          <Link
            href="/"
            aria-label="Nerdy Hub — trang chủ"
            /*
              KHÔNG có `gap` ở đây: khoảng cách 12px giữa con dấu và chữ do
              `padding-left` của .brand-wordmark lo. Để `gap` thì mép cắt của
              khung nằm lệch 12px sang phải con dấu, và chữ sẽ hiện ra từ giữa
              khoảng trống chứ không phải từ sau con dấu.
            */
            className="flex flex-none items-center"
            style={{ viewTransitionName: BRAND_VT_NAME }}
          >
            <LogoMark size={BRAND_LOGO_SIZE} />
            {/*
              CHỮ THẬT, không phải ảnh.

              Chữ trong bản trademark là một font grotesque, mà web đã chạy sẵn
              Helvetica Neue — dựng bằng text thì sắc nét ở mọi cỡ và mọi độ
              phân giải, không tốn thêm một request nào, và tự lật màu theo giao
              diện qua `currentColor` y như con dấu bên cạnh. Nhúng ảnh thì phải
              nuôi hai bản sáng/tối và nó vẫn mờ trên màn hình retina.

              CHỈ CÓ Ở TRANG GIỚI THIỆU. Trong ứng dụng, header còn hàng nav sáu
              tab và cụm nút bên phải, thêm chữ vào là hàng đó chật và con dấu
              mất vai trò mốc neo. Vì vậy nó nằm ở (landing)/layout.tsx chứ
              không phải trong <LogoMark>.

              `leading-[0.9]` để hai dòng bó sát nhau thành một khối chữ nhật —
              đúng như bản trademark; leading mặc định sẽ tách chúng thành hai
              dòng chữ rời. Tổng cao ~36px, vẫn thấp hơn con dấu (48px) nên hàng
              header giữ nguyên 72px.

              Ba lớp span, không gộp được lớp nào: ngoài cùng là khung CẮT đứng
              yên, giữa là lớp mang kiểu chữ, trong cùng là TỪNG DÒNG tự trượt
              lấy — hai dòng lệch nhau nửa giây nên chúng không thể dùng chung
              một animation. Xem .brand-wordmark trong globals.css.
            */}
            <span aria-hidden="true" className="brand-wordmark">
              <span className="text-[20px] leading-[0.9] font-bold tracking-[0.01em]">
                <span className="brand-wordmark-line">NERDY</span>
                <span className="brand-wordmark-line">HUB</span>
              </span>
            </span>
          </Link>

          {/*
            Nằm ở LAYOUT chứ không phải page.tsx, nên nó KHÔNG mang `--pop-i` và
            không nảy lên cùng phần nội dung — giống hệt con dấu. Đó là chủ ý:
            header là cái khung, khung mà cũng nhảy múa thì mất mốc để mắt bám.
          */}
          <LandingAuth />
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
