'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CrownIcon, XIcon } from '../shell/icons'

/**
 * Gợi ý đăng nhập ở kho đề.
 *
 * Phải phân giải session ở CLIENT. Trang /de-thi chạy ISR (`revalidate = 3600`)
 * và app/(marketing)/layout.tsx ghi rõ: gọi `auth()` trong nhánh này sẽ đọc
 * cookie, ép toàn bộ trang công khai sang render động và mất SEO. Cùng lý do và
 * cùng cách làm với AccountMenu trong components/shell/app-shell.tsx.
 *
 * Nội dung đúng với thực tế: lượt làm của khách gắn vào cookie `guest_id` nên
 * chỉ nằm trên máy này, và được gán về tài khoản khi đăng nhập
 * (xem lib/auth/claim-guest.ts).
 */
export function SaveRecordHint() {
  const { status } = useSession()
  const [dismissed, setDismissed] = useState(false)

  // Chưa biết thì chưa nói gì — nhấp nháy một dải rồi biến mất còn khó chịu hơn
  if (status !== 'unauthenticated' || dismissed) return null

  return (
    <div className="panel relative mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-sand text-on-tone">
        <CrownIcon size={20} />
      </span>

      <div className="min-w-0 flex-1 pr-8 sm:pr-0">
        <p className="text-[16px] font-semibold">Đăng nhập để giữ lại kết quả</p>
        <p className="mt-1 text-[14.5px] leading-relaxed text-muted-strong">
          Bạn vẫn làm được mọi đề mà không cần tài khoản. Nhưng khi chưa đăng nhập, lượt làm chỉ
          lưu trên trình duyệt này — đổi máy hoặc xoá dữ liệu duyệt web là mất. Đăng nhập rồi thì
          các bài đã làm trước đó cũng được chuyển về tài khoản.
        </p>
      </div>

      <div className="flex flex-none items-center gap-2.5">
        <Link href="/dang-nhap" className="btn-primary py-2.5 text-[14.5px]">
          Đăng nhập
        </Link>
        <Link href="/dang-ky" className="btn-ghost text-[14.5px]">
          Tạo tài khoản
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Ẩn gợi ý"
        className="absolute top-4 right-4 rounded-lg p-1.5 text-muted hover:bg-card hover:text-ink sm:static sm:self-start"
      >
        <XIcon size={15} />
      </button>
    </div>
  )
}
