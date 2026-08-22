/**
 * Bộ icon inline.
 *
 * Phong cách theo ảnh tham chiếu: nét mảnh (stroke 1.8), bo tròn đầu nét,
 * không tô đặc — khác hẳn bộ icon khối đặc của bản dựng trước.
 */
type IconProps = { size?: number; className?: string }

const S = (p: IconProps) => ({
  width: p.size ?? 20,
  height: p.size ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: p.className,
  'aria-hidden': true,
})

/**
 * Chiều cao con dấu ở góc trái trên, dùng chung cho trang giới thiệu và cho
 * AppShell. Là hằng số chứ không phải con số gõ ở mỗi nơi: hai khung này nằm
 * kề nhau khi chuyển trang nên lệch vài px là mắt bắt được ngay — mà đó đúng
 * là chuyện đã xảy ra khi mỗi bên tự khai một cỡ (34 với 30).
 *
 * Đây là CHIỀU CAO; bề ngang tự ra 1,5 lần theo `aspect-ratio` của .logo-mark,
 * nên 48 nghĩa là con dấu chiếm 48×70px.
 *
 * Trần trên của số này là `--brand-row-height` (72px, xem globals.css): con dấu
 * cao hơn hàng nav thì nó tự nống header của AppShell lên và hai khung lại lệch
 * nhau, vì bên trang giới thiệu không có gì để nống theo.
 */
export const BRAND_LOGO_SIZE = 48

/**
 * Con dấu thương hiệu — cặp kính, nạp từ `public/logo-glasses.svg`.
 *
 * `size` là CHIỀU CAO, không phải cạnh của một ô vuông: cặp kính rộng gấp rưỡi
 * chiều cao, ép nó vào ô vuông thì hoặc méo hoặc thừa một khoảng trống hai bên
 * mà mắt vẫn tính là phần của logo — cụm logo + chữ sẽ trông lệch.
 *
 * Vẽ bằng CSS mask chứ không nhúng thẳng SVG vào JSX: file là bản trace nên
 * riêng dữ liệu path đã 20KB, nhúng inline là 20KB đó lặp lại trong HTML của
 * MỌI trang. Mask thì trình duyệt tải một lần rồi dùng lại từ cache.
 *
 * Mask lấy màu từ `currentColor` nên con dấu khớp màu với chữ "Nerdy Hub"
 * bên cạnh.
 */
export function LogoMark({ size = 34, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `logo-mark ${className}` : 'logo-mark'}
      style={{ height: size }}
    />
  )
}

export function HomeIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V15h-7v5.5H5A1.5 1.5 0 0 1 3.5 19v-8.5Z" />
    </svg>
  )
}

export function BookIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2.5 2.5 0 0 1 2 1v14a2.5 2.5 0 0 0-2-1H5.5A1.5 1.5 0 0 1 4 16.5v-11Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2.5 2.5 0 0 0-2 1v14a2.5 2.5 0 0 1 2-1h4.5a1.5 1.5 0 0 0 1.5-1.5v-11Z" />
    </svg>
  )
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </svg>
  )
}

export function TasksIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  )
}

export function SettingsIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  )
}

export function TimerIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.6M9.5 2.5h5" />
    </svg>
  )
}

export function GameIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M7.5 8h9a4.5 4.5 0 0 1 4.4 3.6l.7 3.6A2.8 2.8 0 0 1 18.9 18c-.9 0-1.7-.4-2.2-1.2L15.6 16H8.4l-1.1.8c-.5.8-1.3 1.2-2.2 1.2a2.8 2.8 0 0 1-2.7-2.8l.7-3.6A4.5 4.5 0 0 1 7.5 8Z" />
      <path d="M7 11.5v2M6 12.5h2M15.5 11.8h.01M17.5 13.8h.01" />
    </svg>
  )
}

export function BellIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3 .8 4.6 1.5 5.5.4.5 0 1.3-.7 1.3H5.7c-.7 0-1.1-.8-.7-1.3.7-.9 1.5-2.5 1.5-5.5Z" />
      <path d="M10.2 20a2.1 2.1 0 0 0 3.6 0" />
    </svg>
  )
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </svg>
  )
}

export function SlidersIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function DotsIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

export function PlusIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function PlayIcon(p: IconProps) {
  return (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={p.className}>
      <path d="M7 4.5l12 7.5-12 7.5z" />
    </svg>
  )
}

export function PauseIcon(p: IconProps) {
  return (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={p.className}>
      <rect x="6" y="4" width="4" height="16" rx="1.5" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" />
    </svg>
  )
}

export function ResetIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M3.5 12a8.5 8.5 0 1 1 2.6 6.1" />
      <path d="M3.5 19v-5h5" />
    </svg>
  )
}

export function CrownIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M4 8.5l3.2 3L12 5l4.8 6.5 3.2-3-1.6 9H5.6L4 8.5Z" />
    </svg>
  )
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  )
}

export function FlagIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M5.5 21V4.5h13l-2.5 4 2.5 4h-13" />
    </svg>
  )
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function XIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ArrowUpIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M12 20V5M12 5l-6 6M12 5l6 6" />
    </svg>
  )
}

export function NoteIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M5.5 4.5A1 1 0 0 1 6.5 3.5h7L19 9v11a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1v-15Z" />
      <path d="M13 3.5V9h5.5M9 13h6M9 16.5h4" />
    </svg>
  )
}

export function WarningIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M10.3 3.7a2 2 0 0 1 3.4 0l7.6 12.8a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3L10.3 3.7Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </svg>
  )
}

export function LockIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="3" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  )
}

export function TargetIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SparkIcon(p: IconProps) {
  return (
    <svg {...S(p)}>
      <path d="M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5L4.5 11l5.5-2 2-5.5Z" />
    </svg>
  )
}

/**
 * Ngôi sao "quan tâm" — Kho đề.
 *
 * `filled` TÔ ĐẶC bằng `currentColor` chứ không đổi màu nét: trạng thái bật/tắt
 * phải đọc được cả khi mắt chỉ liếc qua, mà hai ngôi sao viền cùng cỡ chỉ khác
 * sắc độ thì phải nhìn kỹ mới thấy. Nét vẫn giữ nguyên ở cả hai trạng thái nên
 * hình không đổi kích thước — cùng lý do với luật "đừng thêm bớt viền" ở
 * globals.css.
 */
export function StarIcon(p: IconProps & { filled?: boolean }) {
  return (
    <svg {...S(p)} fill={p.filled ? 'currentColor' : 'none'}>
      <path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.87l-5.2 2.74.99-5.79-4.21-4.1 5.82-.85L12 3.6Z" />
    </svg>
  )
}
