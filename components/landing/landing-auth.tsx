'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ENTER_APP, SlideLink } from '../shell/nav-slide'

/**
 * Góc phải trên trang giới thiệu: đăng nhập, hoặc lối vào cho người đã đăng nhập.
 *
 * PHẢI LÀ CLIENT COMPONENT, và đây không phải chuyện tiện tay. Gọi `auth()` ở
 * layout là đọc cookie, mà đọc cookie thì Next chuyển cả route sang render động
 * — trang giới thiệu đang là ISR (`revalidate = 3600` trong page.tsx) sẽ mất
 * SSG/ISR cùng phần SEO đi kèm. Chỉ mỗi cái nút này cần biết người dùng là ai,
 * nên để nó tự hỏi session ở client. Cùng lý do đã ghi ở components/providers.tsx.
 *
 * Hệ quả phải xử lý: lần render đầu CHƯA có session. Không giữ chỗ thì nút hiện
 * ra muộn một nhịp và đẩy layout — nên trạng thái `loading` trả về một khối
 * đúng bằng cỡ nút thật.
 *
 * Người đã đăng nhập KHÔNG thấy chữ "Đăng nhập" nữa mà thấy tên mình, bấm vào là
 * đi thẳng vào ứng dụng — và đi bằng `ENTER_APP` y như nút CTA cuối hero, để hai
 * lối vào cùng một hiệu ứng chứ không phải một cái trượt một cái không.
 */
export function LandingAuth() {
  const { data: session, status } = useSession()

  /*
    Giữ chỗ ĐÚNG CỠ nút "Đăng nhập" — trạng thái thường gặp nhất ở trang này.

    Hai con số là đo thật trên trang (`getBoundingClientRect`: 108.7 × 39.8),
    không phải ước lượng: lệch vài px là lúc session về, cả cụm nhích một cái.
    Đổi padding hay cỡ chữ của nút bên dưới thì đo lại rồi sửa ở đây.
  */
  if (status === 'loading') {
    return <span aria-hidden="true" className="h-10 w-[109px] rounded-pill bg-soft" />
  }

  const user = session?.user
  if (!user) {
    return (
      <Link href="/dang-nhap" className="btn-secondary px-4 py-2 text-[14.5px]">
        Đăng nhập
      </Link>
    )
  }

  const name = (user.name ?? user.email ?? '').trim()
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <SlideLink
      href="/dashboard"
      type={ENTER_APP}
      aria-label={`Vào ứng dụng với tài khoản ${name}`}
      className="flex items-center gap-2 rounded-pill border border-line py-1.5 pr-4 pl-1.5 transition-colors hover:border-line-strong"
    >
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent text-[15px] font-bold text-[var(--color-accent-fg)]">
        {initial}
      </span>
      {/* `max-w` + `truncate`: tên dài không được đẩy con dấu hay nống hàng header,
          vì chiều cao hàng này là hợp đồng dùng chung với AppShell. */}
      <span className="max-w-[140px] truncate text-[14.5px] font-semibold">{name}</span>
    </SlideLink>
  )
}
