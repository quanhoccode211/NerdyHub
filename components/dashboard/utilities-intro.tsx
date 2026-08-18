import Link from 'next/link'
import type { Translator } from '@/lib/i18n/server'
import type { MessageKey } from '@/lib/i18n/messages'
import { CardHeader } from '../shell/app-shell'
import { ChevronRightIcon, GameIcon, SparkIcon, TargetIcon, TimerIcon } from '../shell/icons'

/**
 * Ô Tiện ích ở Tổng quan — CHỈ LÀ LỐI TẮT, không nhúng tính năng.
 *
 * Đã thử nhúng hẳn đồng hồ Pomodoro chạy được vào đây rồi bỏ: ô này nằm cạnh
 * Lịch và Việc hôm nay trong một hàng ba cột, mà một tiện ích chạy thật thì
 * luôn cần thêm nút, thêm trạng thái, thêm chiều cao — nó nống hẳn hàng lưới
 * lên và biến ô "giới thiệu có gì" thành ô "làm việc". Pomodoro có màn hình
 * riêng yên tĩnh của nó ở /tien-ich/pomodoro.
 *
 * Nên đây là ba dòng dẫn đường, mỗi dòng đúng MỘT dòng chữ mô tả. Thêm tiện ích
 * mới thì thêm vào `ITEMS`; quá bốn dòng thì rút bớt chứ đừng cho ô cao thêm.
 *
 * Vì không còn tính năng nào chạy ở đây nên nó quay lại là SERVER COMPONENT —
 * không `'use client'`, không kéo theo JS nào xuống trình duyệt.
 */

const ITEMS: { href: string; Icon: typeof SparkIcon; tone: string; titleKey: MessageKey; bodyKey: MessageKey }[] = [
  {
    href: '/tien-ich/pomodoro',
    Icon: TimerIcon,
    tone: 'bg-mint-soft',
    titleKey: 'tools.pomodoro',
    bodyKey: 'tools.pomodoroDesc',
  },
  {
    href: '/tien-ich/more-or-less',
    Icon: GameIcon,
    tone: 'bg-peri-soft',
    titleKey: 'tools.moreOrLess',
    bodyKey: 'tools.moreOrLessDesc',
  },
  {
    href: '/tien-ich/wordle',
    Icon: TargetIcon,
    /* `bg-good-soft` chứ không phải `bg-sky-soft`: bảng token không có
       `--color-sky-soft`, gõ vào là ra một class rỗng không báo lỗi. */
    tone: 'bg-good-soft',
    titleKey: 'tools.wordle',
    bodyKey: 'tools.wordleDesc',
  },
]

/* `t` truyền từ trang cha — cùng lý do đã ghi ở learning-hours.tsx: đây là
   server component, thêm 'use client' chỉ để dịch chữ là kéo JS xuống vô ích. */
export function UtilitiesIntro({ t }: { t: Translator }) {
  return (
    <section className="card flex flex-col p-5 md:p-6">
      <CardHeader icon={<SparkIcon size={17} />} title={t('tools.title')} />

      <ul className="flex flex-col gap-1">
        {ITEMS.map(({ href, Icon, tone, titleKey, bodyKey }) => (
          <li key={titleKey}>
            <Link
              href={href}
              className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-soft"
            >
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl text-ink ${tone}`}
              >
                <Icon size={17} />
              </span>
              {/* Bọc chữ trong MỘT phần tử: cha là flex, để trần thì mỗi đoạn
                  text thành một flex item riêng và bị gap chèn vào giữa. */}
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold">{t(titleKey)}</span>
                {/* `truncate` là chốt chặn: mô tả phải gói gọn trong MỘT dòng,
                    hai dòng là ô cao thêm 18px mỗi mục. */}
                <span className="block truncate text-[12.5px] text-muted-strong">{t(bodyKey)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/tien-ich" className="btn-secondary mt-4 py-2 text-[14px]">
        {t('tools.openTab')}
        <ChevronRightIcon size={15} />
      </Link>
    </section>
  )
}
