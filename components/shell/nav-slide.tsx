'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

/**
 * HIỆU ỨNG TRƯỢT KHI ĐỔI TRANG.
 *
 * Dùng THẲNG View Transitions API của trình duyệt, không dùng `<ViewTransition>`
 * của React. Lý do là chuyện đã đo tận nơi, ghi lại kẻo người sau lại đi vòng:
 *
 * React ghép cặp cũ/mới theo VỊ TRÍ TRONG CÂY component. Mà cây ở đây đứt ở mọi
 * ranh giới route group: `(landing)`, `(marketing)` và `(app)` mỗi nhóm dựng
 * layout riêng — kể cả `(marketing)` và `(app)` tuy cùng dựng AppShell nhưng là
 * HAI instance khác nhau. Đi qua ranh giới nào là React thấy một cây biến mất và
 * một cây khác hiện ra, không có cặp nào để nội suy, và nó bỏ qua luôn: vá
 * `document.startViewTransition` rồi đếm số lần gọi thì landing → dashboard cho
 * 0, kể cả khi trang đích đã nằm sẵn trong cache của router.
 *
 * Trình duyệt thì ghép cặp theo `view-transition-name` — một chuỗi CSS. Hai thẻ
 * `<main>` ở hai layout hoàn toàn khác nhau, chỉ cần cùng mang tên
 * `page-content`, là nó hiểu đó là một vật và tự nội suy. Nhờ vậy một cơ chế
 * duy nhất phủ được cả đổi tab lẫn bước từ trang giới thiệu vào ứng dụng.
 */

/** Tên cho vùng nội dung — thứ DUY NHẤT trượt. Xem PAGE_CONTENT_STYLE. */
const PAGE_CONTENT = 'page-content'

/**
 * Gắn cho thẻ bọc nội dung ở MỌI khung (AppShell và trang giới thiệu).
 *
 * Chỉ vùng này mang tên, nên chỉ nó được nhấc ra khỏi ảnh chụp nền và trượt.
 * Thẻ trắng, rail điều hướng, con dấu và cụm nút bên phải nằm lại trong ảnh nền
 * — chúng là cái khung để mắt bám vào, khung mà trôi theo thì hiệu ứng đọc ra
 * như bị đẩy cả cửa sổ.
 */
export const PAGE_CONTENT_STYLE = { viewTransitionName: PAGE_CONTENT }

/** Con dấu thương hiệu — mốc neo, đứng yên xuyên suốt. */
export const BRAND_VT_NAME = 'brand-logo'

/**
 * Cả hàng tab (thanh nền + các icon), đặt tên để nó KHÔNG bị đóng băng.
 *
 * Đây là chỗ đã tốn bốn vòng chỉnh sai. Trong lúc view transition chạy, mọi
 * phần tử KHÔNG có tên đều bị gom vào ảnh chụp `root` — một tấm ảnh TĨNH của
 * trang cũ, cross-fade sang ảnh mới trong 420ms. Hàng icon nằm trong đó, nên
 * `transition: color` đặt trên DOM thật KHÔNG được vẽ ra lấy một khung hình:
 * thứ người dùng nhìn thấy là ảnh cũ mờ dần, và icon ở tab vừa chọn vẫn mang
 * màu tối trong khi ô đen đã phủ lên — nó biến mất suốt hơn 300ms.
 *
 * Mọi lần chỉnh `transition-delay` đều vô nghĩa vì lý do đó. Đặt tên cho hàng
 * tab mới là cách chữa: có tên thì nó được nhấc ra khỏi ảnh `root` và cập nhật
 * NGAY, đúng như con dấu thương hiệu vẫn làm.
 */
export const NAV_RAIL_VT_NAME = 'nav-rail'

/**
 * Ô đen đánh dấu tab đang mở.
 *
 * Chỉ gắn cho ĐÚNG MỘT pill — cái đang active. Nhờ vậy pill cũ và pill mới mang
 * cùng một tên ở hai đầu lần chuyển, trình duyệt hiểu chúng là một vật rồi tự
 * dựng đường đi từ chỗ này sang chỗ kia. Không keyframe, không tính toạ độ,
 * không cần một thanh trượt giả nằm dưới hàng pill.
 *
 * Gắn cho mọi pill là hỏng: tên view-transition phải DUY NHẤT trong một trang,
 * trùng tên thì trình duyệt bỏ qua cả nhóm và không có gì chạy cả.
 */
export const ACTIVE_PILL_VT_NAME = 'nav-active-pill'

/** Hướng trượt, đọc trong CSS bằng `:active-view-transition-type()`. */
export const SLIDE_FORWARD = 'slide-forward'
export const SLIDE_BACK = 'slide-back'

/**
 * Trần chờ trang đích commit. Hết hạn thì đóng transition lại cho chắc.
 *
 * Không có nó thì một route lỗi hoặc chậm bất thường sẽ để lớp phủ view
 * transition nằm đè vĩnh viễn, và trang trông như treo cứng.
 */
const COMMIT_TIMEOUT_MS = 1200

type StartSlide = (href: string, type: string) => void

/**
 * Điều hướng kèm hiệu ứng trượt.
 *
 * `startViewTransition` cần một callback báo "DOM đã cập nhật xong", nhưng
 * `router.push` của App Router trả về ngay chứ không chờ route mới render. Nên
 * ta giữ lại hàm `resolve` và chỉ gọi nó khi `usePathname()` thực sự đổi — đó
 * là tín hiệu đáng tin duy nhất cho biết route mới đã commit.
 */
function useSlideNavigation(): StartSlide {
  const router = useRouter()
  const pathname = usePathname()
  const resolveRef = useRef<(() => void) | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const settle = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    resolveRef.current?.()
    resolveRef.current = null
  }, [])

  /* Route mới đã commit -> thả cho hiệu ứng chạy nốt */
  useEffect(() => {
    settle()
  }, [pathname, settle])

  /* Rời trang giữa chừng thì đừng để lại promise treo */
  useEffect(() => settle, [settle])

  return useCallback(
    (href, type) => {
      /*
        Dạng object có `types` chỉ có ở Chromium 125+ trở lên. Trình duyệt không
        hỗ trợ thì điều hướng thẳng — mất hiệu ứng chứ không hỏng gì.
      */
      if (typeof document.startViewTransition !== 'function') {
        router.push(href)
        return
      }

      document.startViewTransition({
        types: [type],
        update: () =>
          new Promise<void>((resolve) => {
            resolveRef.current = resolve
            timerRef.current = setTimeout(settle, COMMIT_TIMEOUT_MS)
            router.push(href)
          }),
      })
    },
    [router, settle],
  )
}

/**
 * `<Link>` có kèm hiệu ứng trượt.
 *
 * Vẫn là thẻ `<a>` thật với `href` thật: chuột giữa, Ctrl+click, "mở tab mới"
 * và trình thu thập của công cụ tìm kiếm đều làm việc như thường. Chỉ cú click
 * trái trơn mới bị chặn để nhường cho hiệu ứng.
 */
export function SlideLink({
  href,
  type,
  children,
  ...rest
}: {
  href: string
  type: string
  children: React.ReactNode
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'onClick'>) {
  const slide = useSlideNavigation()
  const router = useRouter()

  return (
    <Link
      href={href}
      /*
        Nạp trước ngay khi con trỏ chạm vào, đừng đợi tới lúc bấm.
        Rê chuột tới rồi bấm mất vài trăm mili giây — vừa đủ để route kịp về,
        và cú bấm thành ra không phải chờ gì.

        LƯU Ý KHI ĐO: `next dev` TẮT prefetch, nên ở môi trường dev dòng này
        không đổi được gì cả. Chỉ thấy tác dụng ở bản build production.
      */
      onPointerEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      onClick={(e) => {
        /* Nhường cho trình duyệt: mở tab mới, cửa sổ mới, tải về, chuột giữa */
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return
        }
        e.preventDefault()
        slide(href, type)
      }}
      {...rest}
    >
      {children}
    </Link>
  )
}
