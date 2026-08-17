import { ChevronRightIcon } from '../shell/icons'
import { SLIDE_FORWARD, SlideLink } from '../shell/nav-slide'

/**
 * Nút vào ứng dụng ở cuối hero — thay chỗ thanh subscribe của bản tham chiếu.
 *
 * Trước đây đây là một menu bật lên liệt kê năm chức năng. Bỏ đi: người mới vào
 * chưa biết "Thống kê" hay "Lịch ôn" khác nhau chỗ nào để mà chọn, nên bắt chọn
 * một lần nữa chỉ là thêm một bước. Giờ dẫn thẳng vào Tổng quan, và nav ngang
 * của AppShell lo phần còn lại.
 *
 * `SlideLink` là client component, nên nút này kéo theo một mẩu JS — đánh đổi có
 * ý thức để lấy hiệu ứng trượt sang ứng dụng. Phần còn lại của trang chủ vẫn
 * tĩnh; bản thân thẻ vẫn là `<a href>` thật nên SEO và "mở tab mới" không đổi.
 */
export function EnterButton({
  label = 'Vào học thôi',
  href = '/dashboard',
}: {
  label?: string
  href?: string
}) {
  return (
    <SlideLink href={href} type={SLIDE_FORWARD} className="btn-primary px-7 py-3.5 text-[16px]">
      {label}
      <ChevronRightIcon size={16} />
    </SlideLink>
  )
}
