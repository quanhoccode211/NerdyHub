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
      <PageHeader
        eyebrow="Dụng cụ đi kèm"
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
          <div className="mt-4 flex items-center gap-3">
            <h2 className="text-[21px] font-bold">More or Less</h2>
            <span className="pill bg-sky text-[13px] text-on-tone">Sắp có</span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-strong">
            Game đoán xem bên nào nhiều hơn — dân số, giá tiền, khoảng cách. Chơi nhanh trong
            một phút nghỉ Pomodoro rồi quay lại làm bài.
          </p>
          <p className="mt-4 rounded-xl bg-soft p-3.5 text-[13.5px] leading-relaxed text-muted">
            Đang dựng ở đợt tiếp theo. Bộ câu hỏi sẽ do chúng tôi tự biên soạn, không lấy dữ
            liệu của bên khác.
          </p>
        </section>
      </div>
    </>
  )
}
