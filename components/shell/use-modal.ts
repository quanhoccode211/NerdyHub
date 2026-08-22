'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Biến một khối `role="dialog" aria-modal="true"` thành modal THẬT.
 *
 * Khai báo `aria-modal` là một lời hứa với trình đọc màn hình và với người dùng bàn
 * phím: nền phía sau không tồn tại nữa. Trước đây phòng thi khai lời hứa đó ở ba
 * chỗ mà không thực hiện một điều nào — Tab đi thẳng ra sau lưng hộp thoại, Escape
 * không đóng, nền vẫn cuộn, và bảng xem lại còn không đóng khi bấm ra ngoài.
 *
 * Hook lo bốn việc, tất cả đều là thứ người dùng bàn phím cần:
 *   • đặt focus vào trong khi mở
 *   • bẫy Tab/Shift+Tab quay vòng bên trong
 *   • Escape đóng
 *   • khoá cuộn nền, và TRẢ FOCUS về đúng nút đã mở nó khi đóng
 *
 * Trả về ref để gắn vào phần tử hộp thoại.
 */

/** Những gì có thể nhận focus, trừ các phần tử đã bị vô hiệu hoá hoặc ẩn khỏi tab */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModal<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  // Nút đã mở hộp thoại. Đóng xong phải trả focus về đây, nếu không con trỏ bàn
  // phím rơi về đầu trang và người dùng mất chỗ đứng.
  const openerRef = useRef<HTMLElement | null>(null)

  const focusables = useCallback((): HTMLElement[] => {
    const root = ref.current
    if (!root) return []
    return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }, [])

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement as HTMLElement | null

    // Focus phần tử đầu tiên; không có thì focus chính hộp thoại để Escape và bẫy
    // Tab còn hoạt động (cần tabIndex={-1} trên phần tử gắn ref).
    const first = focusables()[0]
    ;(first ?? ref.current)?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement

      // Quay vòng ở hai đầu — đây chính là phần "bẫy" của bẫy focus
      if (e.shiftKey && (active === firstItem || !ref.current?.contains(active))) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prevOverflow
      openerRef.current?.focus?.()
    }
  }, [open, onClose, focusables])

  return ref
}
