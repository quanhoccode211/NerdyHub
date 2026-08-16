import Link from 'next/link'
import { CardHeader } from '../shell/app-shell'
import { ChevronRightIcon, GameIcon, SparkIcon, TimerIcon } from '../shell/icons'

/**
 * Thay chỗ widget Pomodoro cũ ở Tổng quan.
 *
 * Pomodoro đã dọn sang trang riêng để có màn hình yên tĩnh; ô này chỉ giới
 * thiệu những gì có trong tab Tiện ích và dẫn sang đó.
 */

const ITEMS = [
  {
    href: '/tien-ich/pomodoro',
    Icon: TimerIcon,
    tone: 'bg-mint-soft',
    title: 'Pomodoro',
    body: '25 phút tập trung, 5 phút nghỉ. Chạy tiếp cả khi đổi tab.',
  },
  {
    href: '/tien-ich/more-or-less',
    Icon: GameIcon,
    tone: 'bg-peri-soft',
    title: 'More or Less',
    body: 'Đoán xem bên nào hơn — dân số, diện tích, khoảng cách.',
  },
]

export function UtilitiesIntro() {
  return (
    <section className="card flex flex-col p-5 md:p-6">
      <CardHeader icon={<SparkIcon size={17} />} title="Tiện ích" />

      <ul className="flex flex-col gap-3">
        {ITEMS.map(({ href, Icon, tone, title, body }) => (
          <li key={title}>
            <Link href={href} className="flex gap-3 rounded-2xl p-2.5 transition-colors hover:bg-soft">
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl text-ink ${tone}`}
              >
                <Icon size={19} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15.5px] font-semibold">{title}</span>
                <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted-strong">
                  {body}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/tien-ich"
        className="btn-secondary mt-auto py-2.5 text-[14.5px]"
      >
        Mở tab Tiện ích
        <ChevronRightIcon size={15} />
      </Link>
    </section>
  )
}
