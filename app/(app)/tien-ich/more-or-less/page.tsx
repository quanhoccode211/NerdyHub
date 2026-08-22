import type { Metadata } from 'next'
import Link from 'next/link'
import { MoreOrLess } from '@/components/game/more-or-less'
import { ChevronLeftIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'More or Less',
  robots: { index: false, follow: false },
}

/**
 * Trang game More or Less — đoán xem bên bị ẩn nhiều hơn hay ít hơn.
 * Không PageHeader: chỉ nút quay lại + game chiếm toàn bộ chiều dọc.
 */
export default function MoreOrLessPage() {
  return (
    <>
      <Link
        href="/tien-ich"
        className="btn-ghost -ml-2 inline-flex text-[14.5px]"
        aria-label="Quay lại Tiện ích"
      >
        <ChevronLeftIcon size={15} />
        Tiện ích
      </Link>

      <div className="mt-4">
        <MoreOrLess />
      </div>
    </>
  )
}
