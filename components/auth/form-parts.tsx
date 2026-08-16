'use client'

import { useFormStatus } from 'react-dom'
import { CONSENT_PURPOSES, type ConsentPurpose } from '@/lib/enums'
import { LockIcon, WarningIcon } from '../shell/icons'

export function Field({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  hint,
  required,
  defaultValue,
  max,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  defaultValue?: string
  max?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[14.5px] font-medium">
        {label}
        {required && <span className="ml-1 text-pink">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        max={max}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={`mt-1.5 w-full rounded-xl bg-soft px-4 py-3 text-[16px] outline-none placeholder:text-muted ${
          error ? 'ring-2 ring-red' : ''
        }`}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1.5 text-[13.5px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-[13.5px] font-medium text-red">
          {error}
        </p>
      )}
    </div>
  )
}

export function SubmitButton({
  children,
  disabled = false,
}: {
  children: React.ReactNode
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'Đang xử lý…' : children}
    </button>
  )
}

const CONSENT_LABELS: Record<ConsentPurpose, { title: string; body: string; required: boolean }> = {
  SERVICE_ESSENTIAL: {
    title: 'Vận hành dịch vụ',
    body: 'Lưu bài làm, chấm điểm, khôi phục phiên thi.',
    required: true,
  },
  ANALYTICS: {
    title: 'Phân tích sử dụng',
    body: 'Thống kê ẩn danh để cải thiện chất lượng đề.',
    required: false,
  },
  MARKETING_EMAIL: {
    title: 'Email tiếp thị',
    body: 'Thông báo đề mới và tính năng mới.',
    required: false,
  },
  LEADERBOARD_PUBLIC: {
    title: 'Hiện tên trên bảng xếp hạng',
    body: 'Cho phép hiển thị tên bạn khi so sánh thành tích.',
    required: false,
  },
  CALENDAR_ACCESS: {
    title: 'Kết nối Google Calendar',
    body: 'Tạo lịch ôn riêng trong tài khoản Google của bạn.',
    required: false,
  },
}

/**
 * Consent tách bạch từng mục đích (NĐ 13/2023).
 * KHÔNG có ô tích gộp — mỗi mục đích một checkbox riêng, mục không bắt buộc
 * mặc định TẮT.
 */
export function ConsentChecklist() {
  return (
    <fieldset className="rounded-card bg-soft p-5">
      <legend className="px-1 text-[15px] font-semibold">Sự đồng ý xử lý dữ liệu</legend>
      <p className="mt-1 mb-4 text-[13.5px] leading-relaxed text-muted">
        Theo Nghị định 13/2023/NĐ-CP, bạn đồng ý riêng cho từng mục đích. Các mục không bắt buộc
        đang tắt — bật cái nào tuỳ bạn.
      </p>

      <div className="flex flex-col gap-2.5">
        {CONSENT_PURPOSES.map((purpose) => {
          const meta = CONSENT_LABELS[purpose]
          return (
            <label
              key={purpose}
              className={`flex items-start gap-3 rounded-xl bg-white p-3.5 ${
                meta.required ? 'opacity-90' : 'cursor-pointer hover:bg-purple-soft/40'
              }`}
            >
              <input
                type="checkbox"
                name={`consent_${purpose}`}
                defaultChecked={meta.required}
                disabled={meta.required}
                required={meta.required}
                className="mt-0.5 h-4.5 w-4.5 flex-none accent-purple"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[15px] font-medium">
                  {meta.title}
                  {meta.required && (
                    <span className="pill bg-purple-soft px-2 py-0.5 text-[12px] text-purple">
                      <LockIcon size={10} /> Bắt buộc
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
                  {meta.body}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-2 rounded-xl bg-red-soft px-4 py-3 text-[14.5px] font-medium text-red">
      <WarningIcon size={16} />
      {message}
    </p>
  )
}
