import 'server-only'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import { MESSAGES, format, type MessageKey } from './messages'

/**
 * Đọc ngôn ngữ ở SERVER — chỉ dùng cho trang vốn đã render động.
 *
 * ⛔ ĐỪNG GỌI TRONG `app/(marketing)/de-thi/**`. Nhóm đó là SSG/ISR dựng sẵn từ
 * database (`generateStaticParams`), mà `cookies()` ép cả route sang render
 * động — một lời gọi đặt sai chỗ là xoá sạch phần tĩnh cùng lợi thế SEO mà
 * SPEC F7 đòi. Cũng may là không cần: nội dung đề cố ý KHÔNG dịch.
 *
 * Những trang gọi được (đã là `ƒ` trong bảng build vì chúng đọc cookie danh
 * tính từ trước): dashboard, cài đặt, thống kê, lịch ôn, bài làm, đăng nhập,
 * đăng ký.
 *
 * Dùng ở server thay vì để client tự dịch có một lợi thế thật: chữ ĐÚNG NGAY Ở
 * KHUNG HÌNH ĐẦU, không có nhịp tiếng Việt loé lên rồi mới đổi như phía client.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const raw = store.get(LOCALE_COOKIE)?.value
  return isLocale(raw) ? raw : DEFAULT_LOCALE
}

export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string

/** Bộ dịch cho một request. Gọi một lần ở đầu trang rồi truyền xuống. */
export async function getT(): Promise<Translator> {
  const locale = await getLocale()
  const dict = MESSAGES[locale]
  return (key, vars) => format(dict[key], vars)
}
