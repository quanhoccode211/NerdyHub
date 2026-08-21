/**
 * Lọc HTML của nội dung đề — chạy ở đường GHI, không phải đường đọc.
 *
 * KHÔNG import file này từ bất kỳ route nào của Next. `isomorphic-dompurify` kéo
 * theo jsdom (11MB), mà Turbopack externalize jsdom dưới một alias băm
 * (`require("jsdom-<hash>")`) và alias đó KHÔNG nạp được trên Vercel — mọi route
 * chạm tới nó trả 500 "Failed to load external module". Đó chính là lỗi đã làm
 * phòng thi sập trên bản deploy trong khi localhost vẫn chạy.
 *
 * Cùng lý do với lib/exam-clock.ts được tách khỏi attempt-service: thứ gì kéo
 * theo phụ thuộc nặng thì đứng riêng, để đường request không phải gánh.
 *
 * Chỗ dùng: script seed và script dọn (scripts/sanitize-passages.ts).
 */
import DOMPurify from 'isomorphic-dompurify'

export const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h3', 'h4', 'ul', 'ol', 'li',
  'blockquote', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div',
]

/** Thẻ `class` được giữ: bảng Markdown dựng viền cột bằng class (xem README). */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['class'] })
}
