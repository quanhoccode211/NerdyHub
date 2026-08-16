'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type FormState } from '@/app/actions/auth'
import { Field, FormError, SubmitButton } from './form-parts'
import { GoogleButton } from './register-form'

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />

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
        error={state?.fieldErrors?.password}
      />

      <SubmitButton>Đăng nhập</SubmitButton>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-[13.5px] text-muted">
            <span className="h-px flex-1 bg-line" />
            hoặc
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton label="Đăng nhập bằng Google" />
        </>
      )}

      <p className="text-center text-[14.5px] text-muted">
        Chưa có tài khoản?{' '}
        <Link href="/dang-ky" className="font-medium text-purple hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  )
}
