import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { getT } from '@/lib/i18n/server'
import { GameIcon, SparkIcon, TimerIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Tiện ích',
  robots: { index: false, follow: false },
}

/**
 * Danh mục tiện ích dùng kèm lúc học. Mỗi tiện ích mở ở TRANG RIÊNG, không nhúng
 * vào Tổng quan — Pomodoro cần cả màn hình yên tĩnh của nó.
 */
export default async function UtilitiesPage() {
  const t = await getT()
  return (
    <>
      {/* Không có `eyebrow`: dòng "Dụng cụ đi kèm" đã bỏ. `subtitle` bên dưới
          nói đúng điều đó rồi, giữ cả hai là lặp ý ngay trên đầu trang. */}
      <PageHeader
        title={t('tools.title')}
        subtitle={t('tools.pageSubtitle')}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-ink">
            <TimerIcon size={26} />
          </span>
          <h2 className="mt-4 text-[21px] font-bold">Pomodoro</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            {t('toolsPage.pomodoroDesc')}
          </p>
          <Link href="/tien-ich/pomodoro" className="btn-primary mt-5">
            <SparkIcon size={15} />
            {t('toolsPage.pomodoroOpen')}
          </Link>
        </section>

        <section className="card p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-peri-soft text-ink">
            <GameIcon size={26} />
          </span>
          <h2 className="mt-4 text-[21px] font-bold">More or Less</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            {t('toolsPage.moreOrLessDesc')}
          </p>
          <Link href="/tien-ich/more-or-less" className="btn-primary mt-5">
            <GameIcon size={15} />
            {t('toolsPage.moreOrLessOpen')}
          </Link>
        </section>

        <section className="card p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-[24px] font-bold">
            W
          </span>
          <h2 className="mt-4 text-[21px] font-bold">{t('tools.wordle')}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            {t('toolsPage.wordleDesc')}
          </p>
          <Link href="/tien-ich/wordle" className="btn-primary mt-5">
            <SparkIcon size={15} />
            {t('toolsPage.wordleOpen')}
          </Link>
        </section>
      </div>
    </>
  )
}
