'use client'

import { useActionState, useState } from 'react'
import { completeProfileAction, type FormState } from '@/app/actions/auth'
import { ageFrom } from '@/lib/auth/age'
import { TERMS_VERSION } from '@/lib/legal/terms'
import { ConsentChecklist, Field, FormError, SubmitButton } from './form-parts'
import { TermsDialog } from './terms-dialog'
import { CheckIcon, WarningIcon } from '../shell/icons'

/**
 * Google không trả ngày sinh, mà SPEC F6 bắt buộc xác minh tuổi trước khi
 * xử lý dữ liệu. Nên sau lần đăng nhập Google đầu tiên phải hỏi thêm bước này.
 */
export function CompleteProfileForm() {
  const [state, action] = useActionState<FormState, FormData>(completeProfileAction, null)
  const [birthDate, setBirthDate] = useState('')
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const age = birthDate ? ageFrom(new Date(birthDate)) : null
  const showGuardian = age !== null && Number.isFinite(age) && age < 16 && age >= 0
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />

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
          className={`mt-1.5 w-full rounded-xl bg-soft px-4 py-3 text-[16px] outline-none ${
            state?.fieldErrors?.birthDate ? 'ring-2 ring-red' : ''
          }`}
        />
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
              Bạn dưới 16 tuổi nên cần xác nhận của cha mẹ hoặc người giám hộ. Bạn vẫn làm bài
              được ngay, chỉ chưa lên bảng xếp hạng công khai.
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

      <input type="hidden" name="termsAccepted" value={termsAccepted ? 'yes' : ''} />
      <div
        className={`rounded-card border p-4 transition-colors ${
          termsAccepted ? 'border-good/40 bg-good-soft' : 'border-line bg-soft'
        }`}
      >
        {termsAccepted ? (
          <p className="flex items-start gap-2.5 text-[14.5px] leading-relaxed">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-good text-white">
              <CheckIcon size={12} />
            </span>
            Bạn đã đồng ý Điều khoản sử dụng phiên bản {TERMS_VERSION}.
          </p>
        ) : (
          <>
            <p className="text-[14.5px] leading-relaxed">
              Để tiếp tục, bạn cần đọc và đồng ý Điều khoản sử dụng.
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

      <SubmitButton disabled={!termsAccepted}>Hoàn tất</SubmitButton>

      <TermsDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />
    </form>
  )
}
