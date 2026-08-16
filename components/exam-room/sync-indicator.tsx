'use client'

import { useExamStore } from './store'

/** Vì sao đã ngừng thử lại — nói thẳng, vì người dùng không tự sửa được. */
const BLOCKED_HINT: Record<string, string> = {
  not_in_progress:
    'Bài này đã được nộp hoặc đã hết hạn ở nơi khác. Đang chuyển sang trang kết quả.',
  forbidden: 'Phiên đăng nhập đã thay đổi. Hãy đăng nhập lại rồi tải lại trang này.',
  not_found: 'Không tìm thấy lượt thi này trên máy chủ.',
  invalid_payload: 'Máy chủ từ chối dữ liệu gửi lên. Bài làm vẫn còn trên máy bạn.',
}

/** Chỉ báo trạng thái đồng bộ ở header (SPEC F2.5). */
export function SyncIndicator() {
  const status = useExamStore((s) => s.syncStatus)
  const code = useExamStore((s) => s.syncErrorCode)

  const config = {
    saved: { label: 'Đã lưu', dot: 'bg-green', text: 'text-green' },
    pending: { label: 'Chờ lưu…', dot: 'bg-amber', text: 'text-amber' },
    saving: { label: 'Đang lưu…', dot: 'bg-amber animate-pulse', text: 'text-amber' },
    offline: { label: 'Mất kết nối', dot: 'bg-red', text: 'text-red' },
    error: { label: 'Lỗi lưu, đang thử lại', dot: 'bg-red', text: 'text-red' },
    /*
      Khác 'error' ở đúng một điểm, nhưng là điểm quan trọng nhất: KHÔNG còn thử
      lại nữa. Hiện chữ "đang thử lại" trong khi engine đã dừng hẳn là nói dối
      người dùng về thứ họ đang cần biết nhất.
    */
    blocked: { label: 'Đã ngừng lưu', dot: 'bg-red', text: 'text-red' },
  }[status]

  return (
    <span
      className={`flex items-center gap-2 text-[14px] font-medium ${config.text}`}
      aria-live="polite"
      title={
        status === 'offline'
          ? 'Bài làm vẫn được giữ trên máy bạn và sẽ tự gửi lại khi có mạng.'
          : status === 'blocked'
            ? (BLOCKED_HINT[code ?? ''] ?? 'Không lưu được lên máy chủ.')
            : undefined
      }
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}
