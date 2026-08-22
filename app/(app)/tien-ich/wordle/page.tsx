import type { Metadata } from 'next'
import Link from 'next/link'
import { WordleGame } from '@/components/game/wordle'
import { ChevronLeftIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Wordle từ vựng',
  robots: { index: false, follow: false },
}

/**
 * Wordle tiếng Anh — đoán từ 5 chữ cái, mỗi ngày một từ chung cho mọi người.
 * Không PageHeader: chỉ nút quay lại + game chiếm toàn bộ chiều dọc.
 */
export default function WordlePage() {
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
        <WordleGame />
      </div>
    </>
  )
}
