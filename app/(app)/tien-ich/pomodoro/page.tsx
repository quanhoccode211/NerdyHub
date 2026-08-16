import type { Metadata } from 'next'
import Link from 'next/link'
import { PomodoroClock } from '@/components/pomodoro/pomodoro-clock'
import { ChevronLeftIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Pomodoro',
  robots: { index: false, follow: false },
}

/**
 * Trang chỉ có đồng hồ. Không PageHeader, không thẻ, không số liệu —
 * chỉ một đường quay lại nhỏ để không nhốt người dùng ở đây.
 */
export default function PomodoroPage() {
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

      <PomodoroClock />
    </>
  )
}
