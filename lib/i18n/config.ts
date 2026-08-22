/**
 * Cấu hình đa ngôn ngữ.
 *
 * KHÔNG đi theo hướng lồng locale vào đường dẫn (`/en/de-thi`). Hướng đó chuẩn
 * hơn về SEO nhưng phải dựng lại toàn bộ cây route, `sitemap.ts`, `robots.ts`,
 * mọi `<Link>` và cả `generateStaticParams` của trang đề. Ở phạm vi hiện tại —
 * một công tắc đổi ngôn ngữ trong menu tài khoản — cookie là đủ và không đụng
 * gì tới kiến trúc đang chạy.
 */

export const LOCALES = ['vi', 'en', 'de'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * TIẾNG VIỆT LÀ MẶC ĐỊNH, và là mặc định CỨNG.
 *
 * Không suy ra từ `Accept-Language` của trình duyệt: sản phẩm phục vụ người học
 * Việt Nam, nên một máy cài tiếng Anh vẫn phải thấy tiếng Việt cho tới khi chủ
 * máy tự đổi. Đoán theo trình duyệt là bắt phần lớn người dùng phải đổi ngược
 * lại mỗi lần dùng máy mới.
 */
export const DEFAULT_LOCALE: Locale = 'vi'

export const LOCALE_COOKIE = 'locale'

/** Một năm — cùng hạn với cookie khách, xem lib/session.ts */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Tên ngôn ngữ viết BẰNG CHÍNH NGÔN NGỮ ĐÓ, không dịch sang tiếng đang hiển thị.
 *
 * Người đang lạc trong một giao diện họ không đọc được cần tìm thấy tiếng của
 * mình; "Tiếng Đức" chẳng giúp gì cho người chỉ biết tiếng Đức, "Deutsch" thì có.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  de: 'Deutsch',
}

/** `lang` của thẻ <html>, cũng là thứ trình đọc màn hình dùng để chọn giọng đọc. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  vi: 'vi',
  en: 'en',
  de: 'de',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}
