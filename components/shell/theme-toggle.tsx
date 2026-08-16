'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { MoonIcon, SunIcon } from './icons'

/**
 * Công tắc sáng/tối — một núm trượt duy nhất, mặt trời ở đầu trái, mặt trăng ở
 * đầu phải.
 *
 * Lưu lựa chọn vào localStorage("theme") và toggle class "dark" trên <html>.
 * Script trong app/layout.tsx đọc localStorage trước paint đầu tiên nên không
 * bao giờ nhấp nháy khi reload.
 *
 * Tách khỏi app-shell vì trang chủ không dùng AppShell nhưng vẫn cần đổi giao diện.
 */

/** Khớp với thời lượng khai báo trong globals.css (.theme-transition) */
const TRANSITION_MS = 420

/*
  Danh sách người nghe ở cấp module, để `applyTheme` báo thay đổi ĐỒNG BỘ.

  Không thể chỉ dựa vào MutationObserver: callback của nó là microtask, chạy SAU
  tác vụ hiện tại. Mà `flushSync` bên dưới cần React vẽ lại núm công tắc ngay trong
  lời gọi — nếu đợi observer thì ảnh "mới" của View Transition được chụp lúc núm
  vẫn ở vị trí cũ, và cú trượt biến mất đúng như trước khi có flushSync.

  Observer vẫn giữ, nhưng cho việc khác: thay đổi đến từ NGOÀI component này —
  script chống nhấp nháy trong app/layout.tsx, hoặc DevTools.
*/
const themeListeners = new Set<() => void>()

function applyTheme(next: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', next === 'dark')
  try {
    localStorage.setItem('theme', next)
  } catch {
    /* ignore */
  }
  for (const listener of themeListeners) listener()
}

/**
 * Class "dark" trên <html> là NGUỒN SỰ THẬT, và nó nằm ngoài React: script đồng bộ
 * trong app/layout.tsx gắn nó trước lần paint đầu tiên.
 *
 * `useSyncExternalStore` là công cụ đúng cho đúng tình huống này, và nó sửa một lỗi
 * nhìn thấy được: bản cũ khởi tạo `useState(false)` rồi chỉnh lại trong `useEffect`.
 * Ở lần tải trang đầu thì không sao, nhưng công tắc UNMOUNT rồi MOUNT LẠI mỗi khi
 * điều hướng giữa hai nhóm route khác layout — dashboard/lịch ôn nằm trong (app),
 * đề thi nằm trong (marketing). Mỗi lần như vậy núm vẽ ở bên trái rồi mới trượt
 * sang phải, trông đúng như theme vừa tự đổi trong khi người dùng không chạm gì.
 *
 * Với `getSnapshot`, lần render đầu sau khi mount lại đã có giá trị đúng nên không
 * còn cú trượt nào. `getServerSnapshot` trả false để khớp HTML server render ra.
 */
function subscribeToTheme(onChange: () => void) {
  themeListeners.add(onChange)
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  // Đổi theme ở tab khác cũng phải phản ánh sang tab này
  window.addEventListener('storage', onChange)
  return () => {
    themeListeners.delete(onChange)
    observer.disconnect()
    window.removeEventListener('storage', onChange)
  }
}

const getThemeSnapshot = () => document.documentElement.classList.contains('dark')
const getServerThemeSnapshot = () => false

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  )

  const toggle = useCallback(() => {
    const next: 'light' | 'dark' = isDark ? 'light' : 'dark'
    const root = document.documentElement

    // Người dùng tắt hiệu ứng chuyển động ở hệ điều hành: đổi thẳng, không animate.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme(next)
      return
    }

    /*
      View Transitions chụp ảnh cả trang rồi cross-fade hai tấm. Đây là cách DUY
      NHẤT làm mượt được nền: body vẽ `background-image: var(--app-gradient)`,
      sáng là 1 lớp linear còn tối là 3 lớp radial — CSS không nội suy được giữa
      hai danh sách lớp khác nhau nên `transition: background-image` vô tác dụng.
      Xem khối ghi chú tương ứng trong app/globals.css.

      flushSync là BẮT BUỘC: startViewTransition chụp ảnh "cũ" rồi mới gọi
      callback, mà setState của React là bất đồng bộ — không flush thì núm công
      tắc đã nhảy sang phải TRƯỚC khi ảnh cũ kịp chụp, và cú trượt biến mất.

      Hàm được khai báo non-optional trong lib.dom.d.ts nên kiểm tra bằng
      `typeof … === 'function'` chứ không phải `?.`.
    */
    if (typeof document.startViewTransition === 'function') {
      root.classList.add('theme-transition')
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          applyTheme(next)
        })
      })
      const cleanup = () => root.classList.remove('theme-transition')
      // .then(x, x) chứ KHÔNG .finally(): transition bị bỏ giữa chừng sẽ reject
      // `finished`, và một promise reject không ai bắt là lỗi console.
      transition.finished.then(cleanup, cleanup)
      /*
        `ready` là một promise RIÊNG và cũng reject khi transition bị bỏ qua
        ("InvalidStateError: Transition was aborted because of invalid state" —
        xảy ra khi tab đang ẩn, hoặc khi một transition khác chen vào). Ta không
        cần đợi nó, nhưng bỏ trống thì thành unhandled rejection và Next hiện
        ngay một Issue đỏ ở góc màn hình. Nuốt riêng nó, KHÔNG nuốt
        `updateCallbackDone` — lỗi thật trong applyTheme phải còn thấy được.
      */
      transition.ready.catch(() => {})
      return
    }

    // Trình duyệt không hỗ trợ: transition tạm thời cho màu chữ/nền/viền.
    // Dải gradient sẽ nhảy — chấp nhận, không có cách nào khác.
    root.classList.add('theme-transition')
    applyTheme(next)
    window.setTimeout(() => root.classList.remove('theme-transition'), TRANSITION_MS)
  }, [isDark])

  return (
    <button
      type="button"
      onClick={toggle}
      /*
        Đây là CÔNG TẮC chứ không phải nhóm: role="switch" + aria-checked mới
        đọc được trạng thái bật/tắt. Nhãn mô tả cái công tắc điều khiển, trạng
        thái do aria-checked lo — nên nhãn KHÔNG đổi theo trạng thái.
      */
      role="switch"
      aria-checked={isDark}
      aria-label="Giao diện tối"
      /*
        Hình học: w-14 (56px) − 2px viền − 6px padding = 48px lòng trong, núm
        24px ⇒ quãng chạy đúng 24px = translate-x-6. Ở mobile w-12 (48px):
        40px lòng trong ⇒ 16px = translate-x-4.

        Hẹp bớt dưới sm vì header còn logo, nav cuộn ngang, chuông và avatar —
        ở 375px thì 8px đó là của hàng nav.
      */
      className="relative inline-flex h-8 w-12 flex-none items-center rounded-pill border border-line bg-soft p-[3px] transition-colors hover:border-line-strong sm:w-14"
    >
      {/* Hai icon mờ nằm sẵn hai đầu track, gợi ý núm chạy đi đâu */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[7px] flex items-center text-muted"
      >
        <SunIcon size={12} />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-[7px] flex items-center text-muted"
      >
        <MoonIcon size={12} />
      </span>

      {/* Núm trượt. bg-accent/text-accent-fg tự lật theo theme nên luôn tương phản. */}
      <span
        aria-hidden="true"
        className={`theme-switch-knob relative z-10 grid h-6 w-6 place-items-center rounded-full bg-accent text-[var(--color-accent-fg)] ${
          isDark ? 'translate-x-4 sm:translate-x-6' : 'translate-x-0'
        }`}
      >
        <SunIcon
          size={13}
          className={`theme-switch-icon ${
            isDark ? 'scale-50 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          }`}
        />
        <MoonIcon
          size={13}
          className={`theme-switch-icon ${
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-90 opacity-0'
          }`}
        />
      </span>
    </button>
  )
}
