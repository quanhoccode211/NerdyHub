import type { Metadata } from 'next'
import { Google_Sans_Flex, Playwrite_DE_LA_Guides, Roboto_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

/**
 * Roboto Mono — font chữ chạy của toàn bộ giao diện.
 *
 * RÀNG BUỘC KHÔNG ĐƯỢC BỎ QUA: font phải có subset 'vietnamese'.
 * Nguyên âm tiếng Việt mang hai dấu chồng nhau (mũ/móc + thanh điệu) nằm ở khối
 * Latin Extended Additional U+1EA0–U+1EF9. Font chỉ phủ tới Latin Extended-A sẽ
 * hiển thị đúng "ê" nhưng để "ế", "ệ", "ộ", "ợ", "ữ" rơi sang font dự phòng —
 * lệch nét, lệch chiều cao, sai độ đậm ngay giữa một từ.
 * Đã kiểm chứng: Roboto Mono có subset 'vietnamese' (unicode-range U+1EA0-1EF9).
 *
 * Lưu ý khi chỉnh layout sau này: đây là font ĐỀU CHIỀU RỘNG. Mọi ký tự chiếm
 * đúng một ô như nhau nên cùng một câu sẽ rộng hơn font tỉ lệ khoảng 10–15%.
 * Chỗ nào canh theo bề rộng chữ (bảng, pill, nút hẹp) thì đo lại.
 */
const robotoMono = Roboto_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-app',
  display: 'swap',
})

/**
 * Playwrite DE LA Guides — CHỈ dùng cho chữ "Nerdy Hub" ở góc trái trên.
 *
 * Font viết tay, chỉ có một nét (weight 400) và KHÔNG khai báo subset nào cả —
 * nghĩa là không có bộ ký tự tiếng Việt. Ở đây không sao vì nó chỉ tô đúng hai
 * chữ "Nerdy Hub" toàn ký tự ASCII. TUYỆT ĐỐI không dùng cho chữ tiếng Việt,
 * dấu sẽ rơi sang font dự phòng.
 *
 * Chữ ký hàm của font này khác các font thường: `weight` là BẮT BUỘC, và không
 * nhận `subsets` lẫn `preload` (font không chia subset nên next/font tự lo).
 */
const playwrite = Playwrite_DE_LA_Guides({
  weight: '400',
  variable: '--font-wordmark',
  display: 'swap',
})

/**
 * Google Sans Flex — font của CHỮ CHẠY: mọi <p> và <li>, xem @layer base trong
 * app/globals.css. Tiêu đề, nav, nút, số liệu vẫn là Roboto Mono.
 *
 * Cùng ràng buộc như Roboto Mono: phải có subset 'vietnamese'. Đã kiểm chứng
 * trong node_modules/next/dist/compiled/@next/font/dist/google/font-data.json —
 * font này khai báo đủ latin, latin-ext và vietnamese (U+1EA0–U+1EF9), nên
 * "ế", "ệ", "ộ", "ợ", "ữ" không rơi sang font dự phòng.
 *
 * Đây là font TỈ LỆ, ngược với Roboto Mono: cùng một câu hẹp hơn khoảng 15%, và
 * đơn vị `ch` (bề rộng chữ "0") KHÔNG còn bằng bề rộng trung bình một ký tự.
 * Mọi chỗ chặn dòng bằng `max-w-[..ch]` phải đo lại chứ không quy đổi thẳng.
 *
 * Font biến thiên (wght 1–1000) nên KHÔNG truyền `weight` — xem mục `weight`
 * trong node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md:
 * tham số này chỉ bắt buộc với font không biến thiên.
 *
 * Tên biến là `--font-prose-src` chứ không phải `--font-prose`: cái sau là token
 * Tailwind trong @theme (sinh ra utility `font-prose`), đặt trùng thì next/font
 * ghi đè mất phần font dự phòng.
 */
const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-prose-src',
  display: 'swap',
})

const SITE_NAME = 'Nerdy Hub'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${SITE_NAME} — Kho đề & thi thử có bấm giờ`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Làm đề thi thử VSTEP, TOPIK, THPT Quốc gia online có bấm giờ, chấm điểm tự động và phân tích năng lực. Miễn phí, không cần đăng nhập.',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: SITE_NAME,
  },
  robots: { index: true, follow: true },
}

/**
 * Inline script chống nhấp nháy theme.
 *
 * Chạy ĐỒNG BỘ trong <head> trước lần paint đầu tiên của trình duyệt: đọc
 * localStorage("theme"), nếu là "dark" thì thêm class "dark" lên <html>.
 * Nhờ vậy người dùng đã chọn dark mode không bao giờ thấy flash sáng→tối.
 *
 * Xem node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${robotoMono.variable} ${playwrite.variable} ${googleSansFlex.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
