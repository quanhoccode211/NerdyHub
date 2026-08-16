import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { CheckIcon, SparkIcon } from '@/components/shell/icons'
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_HIGHLIGHTS,
  TERMS_SECTIONS,
  TERMS_VERSION,
} from '@/lib/legal/terms'

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description:
    'Điều khoản sử dụng của Ôn Thi Online: phạm vi dịch vụ, yêu cầu độ tuổi, quyền dữ liệu cá nhân theo Nghị định 13/2023, bản quyền nội dung đề thi và quy tắc phòng thi.',
  alternates: { canonical: '/dieu-khoan' },
}

/**
 * Bản công khai của điều khoản, dùng chung nội dung với popup lúc đăng ký
 * (lib/legal/terms.ts) nên hai nơi không thể lệch nhau.
 */
export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow={`Phiên bản ${TERMS_VERSION} · Hiệu lực từ ${TERMS_EFFECTIVE_DATE}`}
        title="Điều khoản sử dụng"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="card p-6 md:p-8">
          {TERMS_SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mb-8 scroll-mt-24 last:mb-0">
              <h2 className="text-[19px] font-bold">{s.heading}</h2>

              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-2.5 text-[15.5px] leading-relaxed text-muted-strong">
                  {p}
                </p>
              ))}

              {s.bullets && (
                <ul className="mt-2.5 flex list-disc flex-col gap-2 pl-5 text-[15.5px] leading-relaxed text-muted-strong">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}

              {s.callout && (
                <p className="mt-3.5 rounded-xl bg-soft px-4 py-3 text-[14.5px] leading-relaxed">
                  {s.callout}
                </p>
              )}
            </section>
          ))}
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <section className="rounded-card bg-mint-soft p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-bold">
              <SparkIcon size={16} />
              Tóm tắt nhanh
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {TERMS_HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[14px] leading-relaxed">
                  <CheckIcon size={14} className="mt-0.5 flex-none" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <nav className="card p-5" aria-label="Mục lục">
            <h2 className="text-[15px] font-bold">Mục lục</h2>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {TERMS_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-lg px-2 py-1.5 text-[14px] text-muted-strong hover:bg-soft hover:text-ink"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/dang-ky" className="btn-primary w-full">
            Tạo tài khoản
          </Link>
        </aside>
      </div>
    </>
  )
}
