'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { registerAction, type FormState } from '@/app/actions/auth'
import { ageFrom } from '@/lib/auth/age'
import { TERMS_VERSION } from '@/lib/legal/terms'
import { ConsentChecklist, Field, FormError, SubmitButton } from './form-parts'
import { TermsDialog } from './terms-dialog'
import { CheckIcon, WarningIcon } from '../shell/icons'

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(registerAction, null)
  const [birthDate, setBirthDate] = useState('')
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Hiện ô email giám hộ ngay khi người dùng gõ ngày sinh dưới 16 tuổi,
  // thay vì để họ submit rồi mới báo lỗi.
  const age = birthDate ? ageFrom(new Date(birthDate)) : null
  const showGuardian = age !== null && Number.isFinite(age) && age < 16 && age >= 0

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />

      <Field
        label="Tên của bạn"
        name="name"
        required
        placeholder="Nguyễn Văn A"
        error={state?.fieldErrors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        placeholder="ban@example.com"
        error={state?.fieldErrors?.email}
      />
      <Field
        label="Mật khẩu"
        name="password"
        type="password"
        required
        hint="Tối thiểu 8 ký tự"
        error={state?.fieldErrors?.password}
      />

      <div>
        <label htmlFor="birthDate" className="block text-[14.5px] font-medium">
          Ngày sinh <span className="ml-1 text-pink">*</span>
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          required
          max={today}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          aria-invalid={state?.fieldErrors?.birthDate ? true : undefined}
          className={`mt-1.5 w-full rounded-xl bg-soft px-4 py-3 text-[16px] outline-none ${
            state?.fieldErrors?.birthDate ? 'ring-2 ring-red' : ''
          }`}
        />
        <p className="mt-1.5 text-[13.5px] text-muted">
          Bắt buộc theo Nghị định 13/2023/NĐ-CP để xác minh tuổi.
        </p>
        {state?.fieldErrors?.birthDate && (
          <p className="mt-1.5 text-[13.5px] font-medium text-red">
            {state.fieldErrors.birthDate}
          </p>
        )}
      </div>

      {showGuardian && (
        <div className="rounded-card bg-amber-soft p-5">
          <p className="flex items-start gap-2 text-[14.5px] leading-relaxed text-amber">
            <WarningIcon size={16} />
            <span>
              Bạn dưới 16 tuổi. Chúng tôi cần email của cha mẹ hoặc người giám hộ để xin xác
              nhận. Trong lúc chờ, bạn <strong>vẫn làm bài bình thường</strong>, chỉ chưa lên
              bảng xếp hạng công khai và không nhận email tiếp thị.
            </span>
          </p>
          <div className="mt-3">
            <Field
              label="Email cha mẹ / người giám hộ"
              name="guardianEmail"
              type="email"
              required
              placeholder="phuhuynh@example.com"
              error={state?.fieldErrors?.guardianEmail}
            />
          </div>
        </div>
      )}

      <ConsentChecklist />

      {/* Chấp nhận điều khoản — bắt buộc, tách khỏi các consent tuỳ chọn ở trên */}
      <input type="hidden" name="termsAccepted" value={termsAccepted ? 'yes' : ''} />
      <div
        className={`rounded-card border p-4 transition-colors ${
          termsAccepted ? 'border-good/40 bg-good-soft' : 'border-line bg-soft'
        }`}
      >
        {termsAccepted ? (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-good text-white">
              <CheckIcon size={12} />
            </span>
            <p className="text-[14.5px] leading-relaxed">
              Bạn đã đồng ý{' '}
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="font-semibold underline underline-offset-2"
              >
                Điều khoản sử dụng
              </button>{' '}
              phiên bản {TERMS_VERSION}.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[14.5px] leading-relaxed">
              Để tạo tài khoản, bạn cần đọc và đồng ý Điều khoản sử dụng.
            </p>
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="btn-primary mt-3 w-full py-2.5 text-[14.5px]"
            >
              Đọc điều khoản sử dụng
            </button>
          </>
        )}
        {state?.fieldErrors?.termsAccepted && (
          <p className="mt-2 text-[13.5px] font-medium text-bad">
            {state.fieldErrors.termsAccepted}
          </p>
        )}
      </div>

      <SubmitButton disabled={!termsAccepted}>Tạo tài khoản</SubmitButton>

      <TermsDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-[13.5px] text-muted">
            <span className="h-px flex-1 bg-line" />
            hoặc
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton label="Đăng ký bằng Google" />
        </>
      )}

      <p className="text-center text-[14.5px] text-muted">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="font-medium text-purple hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}

/**
 * Nút Google.
 *
 * Dùng `signIn` phía client chứ KHÔNG bọc trong <form>: nút này nằm bên trong
 * form đăng ký/đăng nhập, mà <form> lồng <form> là HTML không hợp lệ và làm
 * hydration thất bại. `signIn` tự lo CSRF nên vẫn là POST đúng chuẩn Auth.js v5.
 */
export function GoogleButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void signIn('google', { callbackUrl: '/dashboard' })
      }}
      className="flex w-full items-center justify-center gap-3 rounded-pill bg-soft py-3.5 text-[16px] font-medium transition-colors hover:bg-purple-soft disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z"
        />
        <path
          fill="#34A853"
          d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.5 46 24 46z"
        />
        <path
          fill="#FBBC05"
          d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-2.9.7-4.3v-5.7H4.5A22 22 0 0 0 2 24c0 3.6.9 6.9 2.5 9.9l7.3-5.6z"
        />
        <path
          fill="#EA4335"
          d="M24 9.5c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 2.9 29.9 1 24 1 15.5 1 8.1 5.8 4.5 13.9l7.3 5.7c1.7-5.1 6.5-9 12.2-9z"
        />
      </svg>
      {label}
    </button>
  )
}
