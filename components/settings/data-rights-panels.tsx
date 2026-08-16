'use client'

import { useState, useTransition } from 'react'
import {
  cancelDeletionAction,
  requestDeletionAction,
  toggleConsentAction,
} from '@/app/actions/data-rights'
import type { ConsentPurpose } from '@/lib/enums'
import { LockIcon, WarningIcon } from '../shell/icons'

export function ConsentToggle({
  purpose,
  title,
  body,
  required,
  granted,
  locked,
  lockReason,
}: {
  purpose: ConsentPurpose
  title: string
  body: string
  required: boolean
  granted: boolean
  locked: boolean
  lockReason?: string
}) {
  const [on, setOn] = useState(granted)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const disabled = required || locked || pending

  function toggle() {
    if (disabled) return
    const next = !on
    setOn(next) // optimistic
    setError(null)
    startTransition(async () => {
      const res = await toggleConsentAction(purpose, next)
      if (!res.ok) {
        setOn(!next) // hoàn tác
        setError(res.message ?? 'Không lưu được')
      }
    })
  }

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold">
            {title}
            {required && (
              <span className="pill bg-purple-soft px-2 py-0.5 text-[12px] text-purple">
                <LockIcon size={10} /> Bắt buộc
              </span>
            )}
          </p>
          <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{body}</p>
          {locked && lockReason && (
            <p className="mt-2 flex items-center gap-1.5 text-[13.5px] font-medium text-amber">
              <WarningIcon size={13} />
              {lockReason}
            </p>
          )}
          {error && <p className="mt-2 text-[13.5px] font-medium text-red">{error}</p>}
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          role="switch"
          aria-checked={on}
          aria-label={`${on ? 'Tắt' : 'Bật'} ${title}`}
          className={`mt-1 flex h-6 w-11 flex-none items-center rounded-full px-0.5 transition-colors ${
            on ? 'bg-purple' : 'bg-line'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white transition-transform ${
              on ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>
    </div>
  )
}

/** Xoá tài khoản — xác nhận 2 bước, phải gõ đúng chữ để tránh bấm nhầm. */
export function DeleteAccountPanel({
  pendingDeletion,
  purgeAfter,
}: {
  pendingDeletion: boolean
  purgeAfter: string | null
}) {
  const [armed, setArmed] = useState(false)
  const [typed, setTyped] = useState('')
  const [pending, startTransition] = useTransition()

  const CONFIRM_WORD = 'XOA TAI KHOAN'

  if (pendingDeletion) {
    return (
      <div className="rounded-card bg-red-soft p-6">
        <h3 className="flex items-center gap-2 text-[17px] font-bold text-red">
          <WarningIcon size={18} />
          Tài khoản đang chờ xoá
        </h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink/75">
          Toàn bộ dữ liệu sẽ bị xoá vĩnh viễn vào{' '}
          <strong>{purgeAfter ? new Date(purgeAfter).toLocaleString('vi-VN') : '—'}</strong>. Bạn
          vẫn có thể huỷ trước thời điểm đó.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void cancelDeletionAction())}
          className="btn-secondary mt-4 disabled:opacity-60"
        >
          {pending ? 'Đang huỷ…' : 'Huỷ yêu cầu xoá'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-card border-2 border-red/20 p-6">
      <h3 className="text-[17px] font-bold text-red">Xoá tài khoản</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-strong">
        Tài khoản bị vô hiệu ngay lập tức, và toàn bộ dữ liệu — bài làm, ghi chú, kế hoạch ôn —
        bị xoá vĩnh viễn sau <strong>48 giờ</strong>. Trong 48 giờ đó bạn có thể đổi ý.
      </p>

      {!armed ? (
        <button type="button" onClick={() => setArmed(true)} className="btn-ghost mt-4 text-red">
          Tôi muốn xoá tài khoản
        </button>
      ) : (
        <div className="mt-4">
          <label htmlFor="confirm-delete" className="block text-[14px] font-medium">
            Gõ <code className="rounded bg-soft px-1.5 py-0.5 font-mono">{CONFIRM_WORD}</code> để
            xác nhận
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-2 w-full rounded-xl bg-soft px-4 py-3 text-[16px] outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD || pending}
              onClick={() => startTransition(() => void requestDeletionAction())}
              className="btn-primary bg-red shadow-none disabled:opacity-40"
            >
              {pending ? 'Đang xử lý…' : 'Xoá tài khoản của tôi'}
            </button>
            <button
              type="button"
              onClick={() => {
                setArmed(false)
                setTyped('')
              }}
              className="btn-ghost"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
