'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * Session được phân giải ở CLIENT, không phải trong layout server.
 *
 * Lý do: gọi `auth()` trong layout của nhóm (marketing) sẽ đọc cookie và ép
 * toàn bộ trang công khai sang render động — mất ISR/SSG và phá yêu cầu SEO
 * của SPEC F7. Chỉ có phần avatar là cần biết người dùng, nên để nó tự lấy
 * session phía client và giữ nội dung trang tĩnh.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
