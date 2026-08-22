import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { ChevronRightIcon, LockIcon, SettingsIcon } from '@/components/shell/icons'
import { optionalUser } from '@/lib/auth/session'
import { ReminderSettings } from '@/components/todos/reminder-settings'
import { CONSENT_SETTINGS_PURPOSES } from '@/lib/enums'
import { getT } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'Cài đặt',
  robots: { index: false, follow: false },
}

/**
 * Trang GIẢI THÍCH các mục đích xử lý dữ liệu theo NĐ 13/2023.
 *
 * Công tắc thật nằm ở /cai-dat/du-lieu và cần đăng nhập — F6 đã xong. Các ô ở đây
 * cố ý chỉ để đọc, và phải nói rõ điều đó: một hàng công tắc trông bấm được nhưng
 * không ghi gì xuống DB còn tệ hơn là không có.
 */
export default async function SettingsPage() {
  const [user, t] = await Promise.all([optionalUser(), getT()])

  const PURPOSE_LABELS: Record<string, { title: string; body: string; required?: boolean }> = {
    SERVICE_ESSENTIAL: {
      title: t('settings.consent.service'),
      body: t('settings.consent.serviceDesc'),
      required: true,
    },
    MARKETING_EMAIL: {
      title: t('settings.consent.marketing'),
      body: t('settings.consent.marketingDesc'),
    },
  }

  return (
    <>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-6">
        <section className="panel p-7">
          <h2 className="text-[21px] font-bold">{t('settings.consentTitle')}</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-strong">
            NĐ 13/2023 yêu cầu tách bạch từng mục đích, không gộp chung một ô tích. Dưới đây là các
            mục đích đã được định nghĩa sẵn trong schema.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {CONSENT_SETTINGS_PURPOSES.map((p) => {
              const meta = PURPOSE_LABELS[p]
              return (
                <div key={p} className="flex items-start gap-4 rounded-2xl bg-card p-4">
                  <div className="min-w-0 flex-1">
                    {/*
                      <h3> chứ không phải <p>: đây là TIÊU ĐỀ của thẻ. Ngoài chuyện
                      đúng ngữ nghĩa, `@layer base` gán font tỉ lệ cho mọi <p> và
                      <li>, nên để là <p> thì tiêu đề mấy thẻ này chạy font khác hẳn
                      tiêu đề mọi thẻ khác trên cùng màn hình.
                    */}
                    <h3 className="flex items-center gap-2 text-[16px] font-semibold">
                      {meta.title}
                      {meta.required && (
                        <span className="pill bg-purple-soft text-purple">{t('form.required')}</span>
                      )}
                    </h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{meta.body}</p>
                  </div>
                  <span
                    className={`mt-1 flex h-6 w-11 flex-none items-center rounded-full px-0.5 ${
                      meta.required ? 'bg-purple' : 'bg-line'
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        meta.required ? 'translate-x-5' : ''
                      }`}
                    />
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-soft p-4 text-[14px] leading-relaxed text-amber">
            <LockIcon size={16} />
            <span>
              {t('settings.readonlyNotice')}
              <Link href="/cai-dat/du-lieu" className="underline underline-offset-2">
                {t('settings.privacyLink')}
              </Link>.
            </span>
          </p>
        </section>

        {/*
          Bảng chỉnh lời nhắc. Đặt ở /cai-dat chứ không ở /cai-dat/du-lieu: đây
          là tuỳ chọn GIAO DIỆN lưu trên máy, không phải một sự đồng ý xử lý dữ
          liệu — trộn vào trang kia là làm loãng đúng chỗ phải đọc kỹ nhất.

          Là client component nên trang này vẫn là server component, chỉ mình nó
          chạy ở trình duyệt (nó phải đọc localStorage).
        */}
        <ReminderSettings />
        </div>

        <aside className="flex flex-col gap-5">
          <section className="panel p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-soft text-purple">
              <SettingsIcon size={22} />
            </span>
            <h2 className="mt-4 text-[18px] font-bold">{t('settings.rightsTitle')}</h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[14.5px] leading-relaxed text-muted-strong">
              <li>{t('settings.rights.auth')}</li>
              <li>{t('settings.rights.age')}</li>
              <li>{t('settings.rights.export')}</li>
              <li>{t('settings.rights.delete')}</li>
            </ul>
            <Link href="/cai-dat/du-lieu" className="btn-secondary mt-4 w-full">
              {t('settings.openPrivacy')}
              <ChevronRightIcon size={15} />
            </Link>
          </section>

          {/*
            `text-on-tone` là BẮT BUỘC trên mọi nền pastel đặc: `--color-lime`
            là màu sáng, dùng `--color-ink` qua nó vẫn an toàn về tương phản.
          */}
          <section className="rounded-card bg-lime p-6 text-on-tone">
            <h2 className="text-[18px] font-bold">{t('settings.currentData')}</h2>
            {/* Hỏi phiên đăng nhập thật thay vì khẳng định cứng: nói với người đã
                đăng nhập rằng họ "đang dùng ở chế độ khách" là nói sai. */}
            <p className="mt-2 text-[14.5px] leading-relaxed">
              {user
                ? t('settings.accountNotice')
                : t('settings.guestNotice')}
            </p>
            <Link href="/bai-lam" className="btn-ghost mt-4 w-full justify-center">
              {t('settings.viewAttempts')}
              <ChevronRightIcon size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  )
}
