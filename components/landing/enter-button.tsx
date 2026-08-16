import Link from 'next/link'
import { ChevronRightIcon } from '../shell/icons'

/**
 * Nút vào ứng dụng ở cuối hero — thay chỗ thanh subscribe của bản tham chiếu.
 *
 * Trước đây đây là một menu bật lên liệt kê năm chức năng. Bỏ đi: người mới vào
 * chưa biết "Thống kê" hay "Lịch ôn" khác nhau chỗ nào để mà chọn, nên bắt chọn
 * một lần nữa chỉ là thêm một bước. Giờ dẫn thẳng vào Tổng quan, và nav ngang
 * của AppShell lo phần còn lại.
 *
 * Không còn state nên cũng không còn 'use client': trang chủ trở lại tĩnh hoàn
 * toàn, không kèm JS nào.
 */
export function EnterButton({
  label = 'Vào học thôi',
  href = '/dashboard',
}: {
  label?: string
  href?: string
}) {
  return (
    <Link href={href} className="btn-primary px-7 py-3.5 text-[16px]">
      {label}
      <ChevronRightIcon size={16} />
    </Link>
  )
}
