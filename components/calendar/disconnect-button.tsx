'use client'

import { useState, useTransition } from 'react'
import { disconnectCalendarAction } from '@/app/actions/calendar'

/**
 * Ngắt kết nối lịch. Hỏi lại một nhịp trước khi làm: thao tác này thu hồi token
 * ở phía Google, không hoàn tác được — muốn dùng lại phải cấp quyền từ đầu.
 */
export function DisconnectCalendarButton() {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn-secondary py-2 text-[14px]"
      >
        Ngắt kết nối
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px] text-muted-strong">Ngắt thật nhé?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void disconnectCalendarAction())}
        className="btn-primary py-2 text-[14px] disabled:opacity-60"
      >
        {pending ? 'Đang ngắt…' : 'Ngắt kết nối'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="btn-ghost py-2 text-[14px]"
      >
        Thôi
      </button>
    </div>
  )
}
