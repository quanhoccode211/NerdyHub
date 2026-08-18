'use client'

import { useEffect } from 'react'
import { LogoMark } from '@/components/shell/icons'
import { APP_LEAVING_CLASS, EXIT_APP, SlideLink, clearEnteringApp } from '@/components/shell/nav-slide'

/**
 * Khung cho các trang xác thực — một cột hẹp, không có rail điều hướng.
 * Người dùng ở đây đang làm một việc duy nhất, không cần menu.
 *
 * PHẢI LÀ CLIENT COMPONENT từ lúc có hiệu ứng chuyển trang: khung này là ĐÍCH
 * của chặng rời trang giới thiệu, nên nó phải tự dọn hai lá cờ mà chặng đó để
 * lại trên <html>. Bên ứng dụng thì AppShell làm việc đó; ở đây không có
 * AppShell nào.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  /*
    DỌN CỜ CỦA CHẶNG TRƯỚC.

    `.pop-leaving` do chặng rời trang giới thiệu gắn, `.app-leaving` do chặng
    rời ứng dụng gắn. Cả hai đều KHÔNG tự hết hạn — chúng được thiết kế để sống
    tới lúc trang đích dựng xong, và trang đích ở đây chính là khung này.

    Không dọn thì lá cờ nằm lại vĩnh viễn: lần sau bước vào dashboard, mọi thẻ
    sẽ chạy pop-out ngay khi vừa hiện ra.

    `clearEnteringApp()` là lớp phòng hờ thứ hai. Đường đi bình thường tới đây
    là ENTER_AUTH, vốn cố ý không bật cờ đó. Nhưng nếu người dùng bấm vào ứng
    dụng rồi đổi ý quay ra trang đăng nhập giữa chừng, cờ có thể còn bật.

    Gỡ trong `useEffect` là đủ, không cần chạy sớm hơn: mọi thứ có hiệu ứng ở
    khung này đều mang class RIÊNG (`.auth-block`), không dính luật
    `:root.pop-leaving .pop-in`. Nên cờ có nán lại một khung hình cũng không
    chạm được vào đâu.

    DỌN CẢ LÚC MOUNT LẪN LÚC UNMOUNT, và vế thứ hai là bắt buộc — đã đo ra lỗi
    thật khi thiếu nó: bấm con dấu ở đây để về trang giới thiệu thì `.app-leaving`
    do chính chặng đó gắn KHÔNG có ai gỡ. Khung này unmount, còn trang giới thiệu
    thì dựng bằng server component nên không chạy effect nào. Đo được cờ vẫn nằm
    trên <html> ở 1314ms sau khi đã về tới nơi, và nó không tự hết hạn: lần sau
    bước vào dashboard, mọi thẻ chạy pop-out ngay khi vừa hiện ra.

    AppShell đã dọn theo đúng cách này ở chiều của nó (gỡ lúc unmount). Khung
    này là nơi thứ hai phát ra `.app-leaving` nên phải tự dọn y hệt.
  */
  useEffect(() => {
    const clear = () => {
      document.documentElement.classList.remove('pop-leaving')
      document.documentElement.classList.remove(APP_LEAVING_CLASS)
      clearEnteringApp()
    }
    clear()
    return clear
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[520px]">
        {/*
          `SlideLink` + `EXIT_APP` chứ không phải `<Link>` trơn: bấm con dấu là
          quay về trang giới thiệu, và chặng đó chạy ngược hiệu ứng vào — hai
          khối rút đi rồi mới điều hướng. Cùng cơ chế với con dấu trong AppShell.
        */}
        <SlideLink
          href="/"
          type={EXIT_APP}
          aria-label="Nerdy Hub — trang chủ"
          /*
            `auth-block` + `--pop-i: 0`: con dấu và trademark là khối đi ĐẦU lúc
            hiện ra, và vì thứ tự bị lộn ngược ở chiều ra nên nó cũng là khối rút
            đi SAU CÙNG — đúng vai mốc neo, giống hệt cách con dấu cư xử ở hai
            khung kia.
          */
          className="auth-block mb-6 flex items-center justify-center"
          style={{ '--pop-i': 0 } as React.CSSProperties}
        >
          <LogoMark size={38} />
          {/*
            TRADEMARK CẠNH CON DẤU, dựng đúng bằng markup của trang giới thiệu
            (app/(landing)/layout.tsx) để hai nơi trượt cùng một kiểu — chữ đi ra
            từ sau con dấu, dòng "HUB" chậm hơn nửa nhịp.

            Ba lớp span, không gộp được lớp nào: ngoài cùng là khung CẮT đứng
            yên, giữa mang kiểu chữ, trong cùng là TỪNG DÒNG tự trượt lấy — hai
            dòng lệch nhau nên không dùng chung một animation được. Xem
            `.brand-wordmark` trong globals.css.

            Cỡ chữ 20px giữ nguyên như bên kia dù con dấu ở đây nhỏ hơn (38px so
            với 48px): trademark là một khối chữ có tỉ lệ riêng, co nó theo con
            dấu thì hai trang cho ra hai bản nhận diện khác nhau.
          */}
          <span aria-hidden="true" className="brand-wordmark">
            <span className="text-[20px] leading-[0.9] font-bold tracking-[0.01em]">
              <span className="brand-wordmark-line">NERDY</span>
              <span className="brand-wordmark-line">HUB</span>
            </span>
          </span>
        </SlideLink>

        <div
          className="auth-block shell-card p-7 md:p-9"
          style={{ '--pop-i': 1 } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
