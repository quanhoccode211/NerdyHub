import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/components/providers'
import './globals.css'

/**
 * HELVETICA NEUE (bản việt hoá) — font DUY NHẤT của cả web.
 *
 * Trước đây có hai font: Roboto Mono cho giao diện và Google Sans Flex cho chữ
 * chạy. Cả hai đã bị thay, nên cái tách đôi `<p>/<li>` trong globals.css cũng
 * không còn — xem khối MỘT FONT DUY NHẤT ở đó.
 *
 * RÀNG BUỘC KHÔNG ĐƯỢC BỎ QUA, giữ nguyên từ bản cũ: font phải phủ tiếng Việt.
 * Nguyên âm tiếng Việt mang hai dấu chồng nhau (mũ/móc + thanh điệu) nằm ở khối
 * Latin Extended Additional U+1EA0–U+1EF9. Font chỉ phủ tới Latin Extended-A sẽ
 * hiển thị đúng "ê" nhưng để "ế", "ệ", "ộ", "ợ", "ữ" rơi sang font dự phòng —
 * lệch nét, lệch chiều cao, sai độ đậm ngay giữa một từ.
 *
 * ĐÃ ĐO TỪNG FILE trước khi chép vào đây (đọc thẳng bảng cmap): cả ba đều phủ
 * 90/90 ký tự U+1EA0–1EF9, 12/12 `ă đ ơ ư ĩ ũ` và 32/32 phần Latin-1. Bộ
 * "Helvetica" thường (không phải Neue) gửi kèm trước đó có ba file Light /
 * Compressed / Rounded chỉ 227 glyph và 0/90 dấu tiếng Việt — KHÔNG dùng được,
 * và đó là lý do phải đo chứ không tin vào tên file.
 *
 * BA CÂN NẶNG, KHÔNG PHẢI BỐN. Bộ này có 100/300/400/500/700/900 nhưng giao
 * diện chỉ cần 400 (chữ chạy), 500 (nhãn) và 700 (tiêu đề). Nấc 600 của
 * Tailwind (`font-semibold`) được ánh xạ sang 700 ngay trong @theme thay vì để
 * trình duyệt tự lùi — xem THANG ĐỘ ĐẬM trong globals.css.
 *
 * KHÔNG nạp Italic: toàn bộ codebase không dùng `italic` chỗ nào, mà mỗi file
 * nghiêng tốn thêm ~215KB. Nếu sau này có `<em>` thì trình duyệt tự nghiêng giả.
 *
 * `declarations` ép cả ba file dùng CHUNG một hộp dòng. Đo được: `hhea` của
 * Regular là 952/-213/28 còn Medium và Bold là 975/-217/29 — lệch 2,3%. Không
 * ép thì một chữ `<strong>` nằm giữa đoạn văn sẽ nống riêng dòng đó cao lên,
 * và cả đoạn có một dòng thưa hơn những dòng khác. Số lấy theo Regular.
 *
 * `adjustFontFallback: 'Arial'` vì Arial là font tương thích metric của
 * Helvetica — xem mục adjustFontFallback trong
 * node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md.
 *
 * GIẤY PHÉP — ĐỌC TRƯỚC KHI PHÁT HÀNH: Helvetica Neue là font thương mại của
 * Monotype/Linotype. Ba file trong app/fonts/ là bản việt hoá lưu hành tự do,
 * KHÔNG kèm giấy phép webfont. Chạy nội bộ thì được, đưa sản phẩm ra ngoài thì
 * phải mua giấy phép hoặc thay bằng font có giấy phép mở (Inter, Be Vietnam
 * Pro, Archivo… đều phủ đủ tiếng Việt). Cùng loại ràng buộc với ảnh hotlink của
 * tầng game — xem README.
 */
const helvetica = localFont({
  src: [
    { path: './fonts/HelveticaNeue.otf', weight: '400', style: 'normal' },
    { path: './fonts/HelveticaNeue-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/HelveticaNeue-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-app',
  display: 'swap',
  fallback: ['Arial', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
  adjustFontFallback: 'Arial',
  declarations: [
    { prop: 'ascent-override', value: '95.2%' },
    { prop: 'descent-override', value: '21.3%' },
    { prop: 'line-gap-override', value: '2.8%' },
  ],
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
    <html lang="vi" className={helvetica.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
