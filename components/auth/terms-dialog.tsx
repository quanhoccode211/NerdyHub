'use client'

import { useEffect, useRef, useState } from 'react'
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_HIGHLIGHTS,
  TERMS_SECTIONS,
  TERMS_VERSION,
} from '@/lib/legal/terms'
import { CheckIcon, SparkIcon, WarningIcon, XIcon } from '../shell/icons'

/**
 * Popup Điều khoản sử dụng.
 *
 * Nút "Tôi đồng ý" chỉ bật khi người dùng đã CUỘN HẾT nội dung — để việc đồng ý
 * không phải là cú bấm phản xạ. Đây cũng là bằng chứng tốt hơn nếu sau này cần
 * chứng minh người dùng đã được tiếp cận đầy đủ điều khoản.
 */
export function TermsDialog({
  open,
  onClose,
  onAccept,
  /** true = chỉ đọc, không có nút đồng ý (dùng khi xem lại) */
  readOnly = false,
}: {
  open: boolean
  onClose: () => void
  onAccept?: () => void
  readOnly?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [readToEnd, setReadToEnd] = useState(false)

  // Khoá cuộn nền khi popup mở
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  // Nội dung ngắn hơn khung thì coi như đã đọc hết ngay
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
      if (atEnd) setReadToEnd(true)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    return () => el.removeEventListener('scroll', check)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[28px] bg-card sm:rounded-[28px]">
        {/* Đầu popup */}
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 id="terms-title" className="text-[22px] font-bold">
              Điều khoản sử dụng
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">
              Phiên bản {TERMS_VERSION} · Hiệu lực từ {TERMS_EFFECTIVE_DATE}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-circle flex-none"
            aria-label="Đóng"
          >
            <XIcon size={16} />
          </button>
        </header>

        {/* Tóm tắt */}
        <div className="border-b border-line bg-mint-soft px-6 py-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            <SparkIcon size={15} />
            Tóm tắt nhanh
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {TERMS_HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-1.5 text-[13.5px] leading-relaxed">
                <CheckIcon size={13} className="mt-0.5 flex-none" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Nội dung đầy đủ */}
        <div ref={scrollRef} className="thin-scroll flex-1 overflow-y-auto px-6 py-5">
          {TERMS_SECTIONS.map((s) => (
            <section key={s.id} className="mb-6 last:mb-0">
              <h3 className="text-[16.5px] font-bold">{s.heading}</h3>

              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-2 text-[14.5px] leading-relaxed text-muted-strong">
                  {p}
                </p>
              ))}

              {s.bullets && (
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[14.5px] leading-relaxed text-muted-strong">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}

              {s.callout && (
                <p className="mt-3 rounded-xl bg-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed">
                  {s.callout}
                </p>
              )}
            </section>
          ))}

          <p className="mt-6 border-t border-line pt-4 text-[13px] text-muted">
            Bạn đã đọc tới cuối tài liệu.
          </p>
        </div>

        {/* Chân popup */}
        <footer className="border-t border-line px-6 py-4">
          {readOnly ? (
            <button type="button" onClick={onClose} className="btn-secondary w-full">
              Đóng
            </button>
          ) : (
            <>
              {!readToEnd && (
                <p className="mb-3 flex items-center gap-2 text-[13.5px] text-warn">
                  <WarningIcon size={14} />
                  Cuộn xuống hết để bật nút đồng ý.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="btn-ghost">
                  Để sau
                </button>
                <button
                  type="button"
                  disabled={!readToEnd}
                  onClick={() => {
                    onAccept?.()
                    onClose()
                  }}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckIcon size={15} />
                  Tôi đã đọc và đồng ý
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
