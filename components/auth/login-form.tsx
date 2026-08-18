'use client'

import { useActionState } from 'react'
import { useLocale } from '@/components/i18n/locale-provider'
import Link from 'next/link'
import { loginAction, type FormState } from '@/app/actions/auth'
import { Field, FormError, SubmitButton } from './form-parts'
import { GoogleButton } from './register-form'

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, null)
  const { t } = useLocale()

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />

      <Field
        label={t('field.email')}
        name="email"
        type="email"
        required
        placeholder="ban@example.com"
        error={state?.fieldErrors?.email}
      />
      <Field
        label={t('field.password')}
        name="password"
        type="password"
        required
        error={state?.fieldErrors?.password}
      />

      <SubmitButton>{t('login.submit')}</SubmitButton>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-[13.5px] text-muted">
            <span className="h-px flex-1 bg-line" />
            {t('form.or')}
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton label={t('login.google')} />
        </>
      )}

      <p className="text-center text-[14.5px] text-muted">
        {t('login.noAccount')}{' '}
        <Link href="/dang-ky" className="font-medium text-purple hover:underline">
          {t('login.toRegister')}
        </Link>
      </p>
    </form>
  )
}
