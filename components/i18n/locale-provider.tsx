'use client'

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HTML_LANG,
  isLocale,
  type Locale,
} from '@/lib/i18n/config'
import { MESSAGES, format, type MessageKey } from '@/lib/i18n/messages'

/**
 * Ngôn ngữ hiển thị, phân giải ở CLIENT — không phải trong layout server.
 *
 * Cùng lý do đã ghi ở components/providers.tsx cho session: đọc cookie trong
 * layout là ép Next chuyển mọi trang công khai sang render động, mất ISR/SSG và
 * phá yêu cầu SEO của SPEC F7. Trang đề (`/de-thi/...`) hiện là SSG dựng sẵn từ
 * database; một lần `cookies()` đặt sai chỗ là xoá sạch phần đó.
 *
 * CÁI GIÁ, nói thẳng ra: khung hình đầu tiên luôn là tiếng Việt. Người đã chọn
 * English/Deutsch sẽ thấy một nhịp tiếng Việt rồi mới đổi. Chấp nhận được vì
 * tiếng Việt là mặc định và là ngôn ngữ của phần lớn người dùng — với họ thì
 * không có nhịp nào cả. Muốn khử hẳn nhịp đó thì phải chuyển sang locale nằm
 * trong đường dẫn, và đó là một đợt làm lại route chứ không phải chỉnh ở đây.
 */

type LocaleContextValue = {
  locale: Locale
  /** Đổi ngôn ngữ KÈM hiệu ứng và dựng lại nội dung từ server. Xem `switchLocale`. */
  switchLocale: (next: Locale) => void
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
}

/**
 * Lớp cờ trên <html> trong lúc đổi ngôn ngữ. Xem globals.css.
 *   `locale-switching` — các khối đang rút đi
 *   `locale-switched`  — nội dung mới đang nảy lên
 */
const SWITCHING = 'locale-switching'
const SWITCHED = 'locale-switched'

/**
 * Chờ dãy rút đi xong rồi mới dựng lại nội dung.
 *
 * Bằng đúng `EXIT_APP_MS` và tính từ cùng bộ biến `--pop-exit-*`
 * (8 * 20ms + 280ms = 440ms, cộng một nhịp dư). Hai chặng này rút đi y hệt nhau
 * nên không có lý do gì để chúng chạy hai nhịp khác nhau.
 */
const SWITCH_OUT_MS = 460

/** Trần gỡ cờ nảy lên: 8 * --pop-enter-step (26ms) + --pop-enter-dur (360ms). */
const SWITCH_IN_MS = 620

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1)
  return isLocale(raw) ? raw : DEFAULT_LOCALE
}

/**
 * Kho ngoài React, đọc bằng `useSyncExternalStore`.
 *
 * KHÔNG dùng `useState` + đọc cookie trong effect. Cách đó chạy được nhưng là
 * đúng cái mẫu `react-hooks/set-state-in-effect` cấm, và lý do lint cấm nó cũng
 * là lý do thật: nó dựng một nhịp thừa (render mặc định -> effect -> render
 * lại) mà React không biết là một phần của quá trình hydrate.
 *
 * `useSyncExternalStore` sinh ra đúng cho tình huống này: `getServerSnapshot`
 * trả mặc định cho bản dựng ở server và cho lần hydrate, `getSnapshot` đọc
 * cookie thật ở những lần sau. React tự lo phần chuyển giữa hai bản.
 */
const listeners = new Set<() => void>()

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

/* Trả về CHUỖI nên React so sánh được bằng giá trị — không sinh object mới mỗi
   lần gọi, thứ sẽ làm `useSyncExternalStore` lặp vô hạn. */
function getSnapshot(): Locale {
  return readCookie()
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const router = useRouter()

  /* `lang` của <html> phải đi theo: trình đọc màn hình chọn giọng đọc từ đó, và
     trình duyệt chọn luật ngắt dòng, dấu ngoặc kép theo nó. */
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANG[locale]
  }, [locale])

  /**
   * Đổi ngôn ngữ: rút nội dung đi, dựng lại từ server, cho nảy lên.
   *
   * PHẢI DỰNG LẠI TỪ SERVER, không chỉ đổi state. Một phần chữ do server render
   * bằng `getT()` (đầu trang Tổng quan, hai trang xác thực) — đám đó đã nằm sẵn
   * trong HTML với ngôn ngữ CŨ, đổi state ở client không chạm tới được. Không
   * dựng lại thì kết quả là một trang nửa Anh nửa Việt.
   *
   * `router.refresh()` CHỨ KHÔNG PHẢI `location.reload()`, dù yêu cầu ghi là
   * "reload". Hai cách cùng cho ra chữ mới, nhưng khác nhau ở đúng chỗ đang cần:
   *   • `reload()` vứt cả tài liệu, trình duyệt vẽ lại từ nền trắng. Mọi hiệu
   *     ứng đứt đoạn ở đó — không có cách nào cho nội dung "nảy lên" sau một cú
   *     tải trang, vì JS cũng vừa bị nạp lại từ đầu.
   *   • `refresh()` chỉ lấy lại phần server component rồi ghép vào cây đang
   *     chạy. Giữ nguyên vị trí cuộn, giữ state của React, và quan trọng nhất:
   *     giữ được mạch để chạy tiếp hiệu ứng nảy lên.
   * Đó cũng đúng tinh thần "không chuyển trang khác, chỉ đổi ngôn ngữ".
   */
  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === readCookie()) return

      /*
        Ghi cookie thẳng bằng JS, không qua server action: đây là lựa chọn hiển
        thị thuần tuý, không đụng dữ liệu nào trên máy chủ. `SameSite=Lax` và
        không `Secure` ở localhost để còn chạy được lúc phát triển.

        Ghi TRƯỚC `refresh()` là bắt buộc — request lấy lại server component sẽ
        mang theo cookie này, và nó phải là cookie mới.
      */
      const secure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
      /* Cookie không bắn sự kiện nào — phải tự gọi để mọi component đọc lại. */
      listeners.forEach((l) => l())

      const root = document.documentElement

      /*
        Giảm chuyển động: bỏ luôn phần chờ. Giữ `setTimeout` mà tắt animation
        thì người dùng chỉ nhận được 460ms màn hình đứng im không lý do — cùng
        cách xử lý với các chặng chuyển trang, xem nav-slide.tsx.
      */
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.refresh()
        return
      }

      root.classList.add(SWITCHING)
      window.setTimeout(() => {
        root.classList.remove(SWITCHING)
        root.classList.add(SWITCHED)
        router.refresh()
        /* Gỡ cờ nảy lên, nếu không mọi lần dựng lại sau đó cũng nảy một loạt. */
        window.setTimeout(() => root.classList.remove(SWITCHED), SWITCH_IN_MS)
      }, SWITCH_OUT_MS)
    },
    [router],
  )

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      format(MESSAGES[locale][key], vars),
    [locale],
  )

  return (
    <LocaleContext.Provider value={{ locale, switchLocale, t }}>{children}</LocaleContext.Provider>
  )
}

/**
 * Hỏng thì HỎNG TO, không im lặng trả về tiếng Việt.
 *
 * Một component quên nằm trong provider mà vẫn hiện chữ đúng thì lỗi đó sống
 * sót tới khi có người đổi ngôn ngữ và thấy đúng chỗ ấy không đổi — lúc đó rất
 * khó lần ra. Ném lỗi ngay thì nó lộ ở lần chạy đầu tiên.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale phải nằm trong <LocaleProvider>')
  return ctx
}
