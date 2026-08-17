import { ViewTransition } from 'react'

/**
 * Transition type khi đổi tab TRONG ứng dụng.
 *
 * Hướng lấy theo THỨ TỰ TAB TRÊN RAIL chứ không theo lịch sử duyệt — xem chỗ
 * gắn ở components/shell/app-shell.tsx.
 */
export const TAB_FORWARD = 'tab-forward'
export const TAB_BACK = 'tab-back'

/** Lớp CSS của hiệu ứng — định nghĩa ở app/globals.css. */
const SLIDE_FORWARD = 'nav-forward'
const SLIDE_BACK = 'nav-back'

/**
 * Tên view-transition của con dấu thương hiệu.
 *
 * Đặt tên là nhấc nó ra khỏi ảnh chụp chung, nên nó không bị cuốn vào hiệu ứng
 * mờ/trượt của phần còn lại. Con dấu đứng đúng một chỗ ở cả trang giới thiệu
 * lẫn trong ứng dụng, và nó cần đứng yên như vậy trong mọi lần chuyển.
 */
export const BRAND_VT_NAME = 'brand-logo'

/**
 * Tên view-transition của ô đen đánh dấu tab đang mở.
 *
 * Chỉ gắn cho ĐÚNG MỘT pill — cái đang active. Nhờ vậy pill cũ và pill mới mang
 * cùng một tên ở hai đầu của lần chuyển, trình duyệt hiểu chúng là một vật rồi
 * tự cho nó chạy từ chỗ cũ sang chỗ mới. Không phải tính toạ độ, không cần
 * `left`/`transform`, không cần một thanh trượt giả nằm dưới hàng pill.
 *
 * Gắn cho mọi pill là hỏng: tên view-transition phải DUY NHẤT trong một trang,
 * trùng tên thì trình duyệt bỏ qua cả nhóm và không có gì chạy cả.
 */
export const ACTIVE_PILL_VT_NAME = 'nav-active-pill'

/**
 * Trượt VÙNG NỘI DUNG khi đổi tab trong ứng dụng. Thẻ trắng, rail điều hướng,
 * con dấu và cụm nút bên phải đứng yên — chỉ phần bên dưới đổi chỗ.
 *
 * Hướng trượt lấy theo thứ tự tab trên rail: sang tab bên phải thì nội dung lùi
 * sang trái, quay lại tab bên trái thì nó trôi ngược lại. Các tab là những mục
 * ngang hàng, không có "sâu hơn" hay "nông hơn" — nếu cái nào cũng trượt cùng
 * một chiều thì chuyển động không còn nói lên điều gì, mà tệ hơn là nó nói sai:
 * mắt đọc "đi tiếp" trong khi người dùng vừa quay lại chỗ cũ.
 *
 * `key` là bắt buộc: layout `(app)` sống xuyên suốt mọi lần đổi tab, nên không
 * đổi key thì React coi đây là cập nhật tại chỗ và không có cặp exit/enter nào
 * để chạy hiệu ứng.
 *
 * `default: 'none'` để chỉ những lần điều hướng có mang transition type mới
 * chạy. Nút back của trình duyệt, `router.refresh()` hay Suspense hé lộ nội
 * dung đều không mang type nào, và đều không nên trượt.
 *
 * GHI CHÚ CHO NGƯỜI LÀM TIẾP — vì sao ở đây KHÔNG có hiệu ứng cho bước từ
 * trang giới thiệu vào ứng dụng: `(landing)` và `(app)` là hai route group với
 * hai layout khác nhau, và khi đi qua ranh giới đó React KHÔNG khởi động view
 * transition nào cả. Đã đo tận nơi bằng cách vá `document.startViewTransition`
 * rồi đếm số lần gọi: đổi tab cho 1, còn landing → dashboard cho 0, kể cả khi
 * dashboard đã nằm sẵn trong cache của router (nên không phải chuyện tải chậm).
 * Đặt `<ViewTransition>` ở layout hay ở page đều cho cùng kết quả. Muốn làm
 * bước đó thì phải gọi thẳng `document.startViewTransition` của trình duyệt,
 * và khi ấy nút CTA phải thành client component.
 */
export function TabSlide({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  return (
    <ViewTransition
      key={routeKey}
      enter={{ [TAB_FORWARD]: SLIDE_FORWARD, [TAB_BACK]: SLIDE_BACK, default: 'none' }}
      exit={{ [TAB_FORWARD]: SLIDE_FORWARD, [TAB_BACK]: SLIDE_BACK, default: 'none' }}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
