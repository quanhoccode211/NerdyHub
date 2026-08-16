import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { SaveRecordHint } from '@/components/catalog/save-record-hint'
import { ChevronRightIcon } from '@/components/shell/icons'
import { getExamsWithCounts } from '@/lib/queries'
import { cardTone, formatNumber } from '@/lib/format'
import {
  EXAM_CATEGORIES,
  EXAM_CATEGORY_LABELS,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  type ExamCategory,
  type Language,
} from '@/lib/enums'

export const metadata: Metadata = {
  title: 'Tất cả kỳ thi — kho đề thi thử online',
  description:
    'Danh mục toàn bộ kỳ thi có đề thi thử online: VSTEP, TOPIK, THPT Quốc gia. Làm bài có bấm giờ, chấm điểm tự động, miễn phí.',
  alternates: { canonical: '/de-thi' },
}

// ISR 1 giờ — SPEC mục 6: TTFB < 500ms cho trang đề
export const revalidate = 3600

export default async function ExamCatalogPage() {
  const exams = await getExamsWithCounts()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Đề thi', item: '/de-thi' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        title="Kho đề thi"
        subtitle="Chọn kỳ thi bạn đang chuẩn bị. Tất cả đề đều làm được ngay, không cần đăng nhập."
      />

      <SaveRecordHint />

      {EXAM_CATEGORIES.map((category) => {
        const group = exams.filter((e) => e.category === category)
        if (group.length === 0) return null

        return (
          <section key={category} className="mb-10" aria-labelledby={`cat-${category}`}>
            <h2 id={`cat-${category}`} className="mb-4 text-[23px] font-bold">
              {EXAM_CATEGORY_LABELS[category as ExamCategory]}
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.map((exam, i) => {
                const tone = cardTone(i)
                return (
                  <Link
                    key={exam.id}
                    href={`/de-thi/${exam.slug}`}
                    className={`${tone.bg} group rounded-card p-7 text-on-tone transition-transform hover:-translate-y-1`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold">
                          {exam.name}{' '}
                          <span aria-hidden="true">{LANGUAGE_FLAGS[exam.language as Language]}</span>
                        </h3>
                        <p className="mt-1 truncate text-[14px] text-on-tone/55">{exam.fullName}</p>
                      </div>
                      <span className="flex-none rounded-[14px] bg-on-tone/10 px-3 py-1.5 text-[13.5px] font-semibold">
                        {LANGUAGE_LABELS[exam.language as Language]}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-on-tone/65">
                      {exam.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-on-tone/10 pt-4">
                      <span className="text-[15px] font-medium">
                        {exam.paperCount} đề · {formatNumber(exam.attemptTotal)} lượt
                      </span>
                      <span className="flex items-center gap-1 text-[15px] font-semibold opacity-70 transition-opacity group-hover:opacity-100">
                        Xem <ChevronRightIcon size={15} />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {exams.length === 0 && (
        <p className="panel p-8 text-center text-muted">Chưa có kỳ thi nào được công bố.</p>
      )}
    </>
  )
}
