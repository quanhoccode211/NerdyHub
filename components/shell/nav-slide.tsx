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
 * Cụm nút bên phải header (chuông, nút sáng/tối, tài khoản) — cũng KHÔNG được
 * đóng băng, cùng lý do với hàng tab.
 *
 * Ba nút này giống hệt nhau ở mọi trang chức năng, nên đúng ra chúng phải đứng
 * yên như con dấu. Không đặt tên thì chúng rơi vào ảnh chụp `root` và bị
 * cross-fade cùng cả trang: mắt đọc ra là chúng cũng "chuyển trang" theo, dù
 * nội dung không đổi một pixel nào.
 */
export const HEADER_ACTIONS_VT_NAME = 'header-actions'

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
 * BƯỚC TỪ TRANG GIỚI THIỆU VÀO ỨNG DỤNG — KHÔNG phải một kiểu trượt.
 *
 * Ba kiểu kia đi qua View Transitions API. Kiểu này thì không, và đó là điểm
 * chính: yêu cầu là các element của trang giới thiệu biến mất LẦN LƯỢT, mà
 * trong lúc view transition chạy, trang cũ chỉ còn là một ẢNH CHỤP TĨNH —
 * không có element riêng lẻ nào để mà cho biến mất lần lượt (xem cạm bẫy
 * "cái gì không có tên thì bị đóng băng" ở README).
 *
 * Nên chặng này chia làm ba, chạy trên DOM THẬT:
 *   1. Gắn `.pop-leaving` lên <html> -> CSS chạy ngược hiệu ứng nảy, theo thứ
 *      tự ngược (xem globals.css).
 *   2. Chờ đủ dãy rồi mới `router.push` — không có view transition nào cả, vì
 *      trang cũ lúc này đã trống, trượt thêm một nhịp là thừa.
 *   3. AppShell thấy cờ `enteringApp` thì gắn `.enter-stagger` lên <main> để
 *      các khối của trang đích nảy lên lần lượt, rồi tự gỡ.
 *
 * Hiệu ứng giữa các trang chức năng KHÔNG đụng tới: chúng vẫn đi đường
 * SLIDE_FORWARD / SLIDE_BACK như cũ.
 */
export const ENTER_APP = 'enter-app'

/**
 * Chờ CHẶNG DÀI NHẤT của cú rời trang, không phải chặng đầu tiên xong.
 *
 * Hai thứ chạy song song khi thoát trang giới thiệu, cả hai khai trong
 * globals.css:
 *   • nội dung nảy ngược: `--pop-last` (6) * `--pop-out-step` (32ms)
 *     + `--pop-out-dur` (220ms) = 412ms
 *   • trademark thụt vào sau con dấu, dòng "HUB" đi sau cùng:
 *     `--wordmark-out-delay` (60ms) + `--wordmark-stagger` (100ms)
 *     + `--wordmark-out-dur` (350ms) = 510ms  <- vẫn dài hơn, chính nó quyết định
 *
 * 530ms là 510 cộng một nhịp dư. Đặt ngắn hơn là điều hướng lúc chữ còn đang
 * trượt dở, và nó bị cắt ngang giữa chừng vì bên ứng dụng không có trademark
 * nào để nối tiếp. Đổi bất kỳ biến nào ở trên thì tính lại con số này.
 *
 * Từng là 630ms khi `--wordmark-stagger` còn 200ms. Hạ stagger xuống 100ms rút
 * được 100ms khỏi quãng người dùng nhìn màn hình trắng chờ điều hướng.
 */
const POP_OUT_MS = 530

/**
 * RỜI ỨNG DỤNG VỀ TRANG GIỚI THIỆU — chiều ngược của ENTER_APP.
 *
 * Cùng lý do không dùng View Transitions API: yêu cầu là các khối của dashboard
 * rút đi LẦN LƯỢT, mà trong lúc view transition chạy thì trang cũ chỉ còn là một
 * ảnh chụp tĩnh, không có element riêng lẻ nào để cho rút đi lần lượt.
 *
 * Chặng này chia làm ba, chạy trên DOM THẬT:
 *   1. Gắn `.app-leaving` lên <html> -> CSS chạy `pop-out` trên các khối trong
 *      `.app-main`, theo thứ tự ngược lúc hiện ra (xem globals.css).
 *   2. Chờ đủ dãy rồi mới `router.push`.
 *   3. Trang giới thiệu KHÔNG cần cờ nào cả — mọi khối hero của nó đã mang sẵn
 *      `.pop-in`, và `.pop-in` chạy ngay khi element được dựng. Đây là chỗ hai
 *      chiều KHÔNG đối xứng: chiều vào phải có `enteringApp` vì các thẻ dashboard
 *      không tự mang hiệu ứng nào, chiều ra thì không.
 *
 * Con dấu là thứ duy nhất đứng yên xuyên suốt: nó có mặt ở cả hai khung, cùng
 * toạ độ. Trademark "NERDY HUB" bên trang giới thiệu tự trượt ra từ sau nó khi
 * trang đích dựng xong — tức chặng này khép lại đúng bằng động tác ngược với lúc
 * chữ thụt vào ở ENTER_APP.
 */
export const EXIT_APP = 'exit-app'

/**
 * Chờ hết dãy rút đi rồi mới điều hướng.
 *
 * Khác ENTER_APP ở chỗ chỉ có MỘT chặng phải chờ, không phải hai: bên ứng dụng
 * không có trademark nào để thụt vào, nên không có chặng 510ms cạnh tranh.
 *
 *   `--pop-exit-last` (8) * `--pop-exit-step` (20ms) + `--pop-exit-dur` (280ms)
 *   = 440ms
 *
 * 460ms là 440 cộng một nhịp dư, cùng cách tính với POP_OUT_MS. Đổi ba biến
 * `--pop-exit-*` trong globals.css thì tính lại con số này.
 */
const EXIT_APP_MS = 460

/** Cờ trên <html> suốt chặng rút đi. AppShell gỡ lúc unmount — xem chỗ dùng. */
export const APP_LEAVING_CLASS = 'app-leaving'

/**
 * Cờ một lần: "vừa bước từ trang giới thiệu vào".
 *
 * Là biến cấp module chứ không phải sessionStorage, vì nó chỉ cần sống qua ĐÚNG
 * một lần điều hướng phía client — mà điều hướng phía client thì không nạp lại
 * JS, nên biến còn nguyên. sessionStorage thì sống qua cả F5 và sẽ bắn hiệu ứng
 * vào một lần tải trang chẳng liên quan gì.
 */
let enteringApp = false

/** AppShell đọc lúc render, rồi gọi `clearEnteringApp()` trong effect. */
export function isEnteringApp() {
  return enteringApp
}

export function clearEnteringApp() {
  enteringApp = false
}

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
        VÀO ỨNG DỤNG: chạy hiệu ứng thoát trên DOM thật rồi mới đi, không dùng
        view transition. Lý do đầy đủ ở chỗ khai ENTER_APP.
      */
      if (type === ENTER_APP) {
        enteringApp = true

        /*
          Giảm chuyển động: bỏ luôn phần chờ. Giữ `setTimeout` mà tắt animation
          thì người dùng chỉ nhận được 420ms màn hình đứng im không lý do.
        */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          router.push(href)
          return
        }

        document.documentElement.classList.add('pop-leaving')
        /*
          Class được gỡ ở AppShell lúc trang đích mount, KHÔNG phải ở đây: gỡ
          sớm là những element chưa tới lượt bật lại đầy đủ trong đúng khung
          hình cuối trước khi trang đổi.
        */
        window.setTimeout(() => router.push(href), POP_OUT_MS)
        return
      }

      /*
        RỜI ỨNG DỤNG: cũng chạy trên DOM thật, cùng lý do. Xem chỗ khai EXIT_APP.
      */
      if (type === EXIT_APP) {
        /* Giảm chuyển động: bỏ luôn phần chờ, y như nhánh trên */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          router.push(href)
          return
        }

        document.documentElement.classList.add(APP_LEAVING_CLASS)
        /*
          Cờ được gỡ lúc AppShell unmount, KHÔNG phải ở đây — cùng lý do với
          `.pop-leaving`: gỡ sớm là những thẻ chưa tới lượt bật lại đầy đủ trong
          đúng khung hình cuối trước khi trang đổi.
        */
        window.setTimeout(() => router.push(href), EXIT_APP_MS)
        return
      }

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
