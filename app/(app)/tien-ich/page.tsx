import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { GameIcon, SparkIcon, TimerIcon } from '@/components/shell/icons'

export const metadata: Metadata = {
  title: 'Tiện ích',
  robots: { index: false, follow: false },
}

/**
 * Danh mục tiện ích dùng kèm lúc học. Mỗi tiện ích mở ở TRANG RIÊNG, không nhúng
 * vào Tổng quan — Pomodoro cần cả màn hình yên tĩnh của nó.
 */
export default function UtilitiesPage() {
  return (
    <>
      {/* Không có `eyebrow`: dòng "Dụng cụ đi kèm" đã bỏ. `subtitle` bên dưới
          nói đúng điều đó rồi, giữ cả hai là lặp ý ngay trên đầu trang. */}
      <PageHeader
        title="Tiện ích"
        subtitle="Vài thứ nhỏ dùng kèm lúc ôn. Mở ra khi cần, đóng lại khi xong."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-ink">
            <TimerIcon size={26} />
          </span>
          <h2 className="mt-4 text-[21px] font-bold">Pomodoro</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            Đồng hồ tập trung 25 phút, nghỉ 5 phút, cứ 4 phiên thì nghỉ dài 15 phút. Chạy tiếp
            kể cả khi bạn chuyển tab hoặc tải lại trang.
          </p>
          <Link href="/tien-ich/pomodoro" className="btn-primary mt-5">
            <SparkIcon size={15} />
            Mở Pomodoro
          </Link>
        </section>

        <section className="card p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-peri-soft text-ink">
            <GameIcon size={26} />
          </span>
          <h2 className="mt-4 text-[21px] font-bold">More or Less</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            Game đoán xem bên nào nhiều hơn — dân số, diện tích, GDP, nghệ sĩ Việt. Chơi
            nhanh trong một phút nghỉ Pomodoro rồi quay lại làm bài.
          </p>
          <Link href="/tien-ich/more-or-less" className="btn-primary mt-5">
            <GameIcon size={15} />
            Mở More or Less
          </Link>
        </section>

        <section className="card p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-[24px] font-bold">
            W
          </span>
          <h2 className="mt-4 text-[21px] font-bold">Wordle từ vựng</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            Đoán từ tiếng Anh 5 chữ cái — mỗi ngày một từ chung cho mọi người, kèm nghĩa
            tiếng Việt sau khi xong. Có chế độ luyện tập vô hạn.
          </p>
          <Link href="/tien-ich/wordle" className="btn-primary mt-5">
            <SparkIcon size={15} />
            Mở Wordle
          </Link>
        </section>
      </div>
    </>
  )
}
