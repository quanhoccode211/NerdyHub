'use client'

import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from './i18n/locale-provider'

/**
 * Session được phân giải ở CLIENT, không phải trong layout server.
 *
 * Lý do: gọi `auth()` trong layout của nhóm (marketing) sẽ đọc cookie và ép
 * toàn bộ trang công khai sang render động — mất ISR/SSG và phá yêu cầu SEO
 * của SPEC F7. Chỉ có phần avatar là cần biết người dùng, nên để nó tự lấy
 * session phía client và giữ nội dung trang tĩnh.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  /*
    `LocaleProvider` nằm TRONG `SessionProvider`, không phải ngoài: nó không cần
    biết người dùng là ai, nhưng các component đọc cả hai thì nằm gọn trong một
    cây là đủ. Thứ tự ngược lại cũng chạy — chỉ là không có lý do gì để đảo.

    Cả hai cùng phân giải ở client, cùng một lý do: giữ trang công khai ở dạng
    tĩnh. Xem ghi chú trong từng file.
  */
  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  )
}
