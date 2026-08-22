import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/app-shell'
import { SaveRecordHint } from '@/components/catalog/save-record-hint'
import { ChevronRightIcon } from '@/components/shell/icons'
import { getExamsWithCounts } from '@/lib/queries'
import { formatNumber } from '@/lib/format'
import { FavoriteStar } from '@/components/exams/favorite-star'
import {
  EXAM_CATEGORIES,
  EXAM_CATEGORY_LABELS,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  languageStripe,
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
              {group.map((exam) => (
                /*
                  Thẻ TRẮNG + một dải màu dọc bên trái, thay cho bản nền pastel
                  đặc trước đây.

                  Nền pastel đổi màu theo THỨ TỰ thẻ trong danh sách (`cardTone(i)`),
                  nên cùng một kỳ thi lại mang màu khác nhau tuỳ nó đứng thứ mấy —
                  màu không nói lên điều gì và người dùng không nhớ được. Dải màu
                  thì bám theo NGÔN NGỮ, nên VSTEP ở đâu cũng là dải Anh.

                  `overflow-hidden` để dải màu bị cắt theo góc bo của thẻ; thiếu
                  nó thì dải chạy thẳng ra ngoài và đâm thủng hai góc trái.
                */
                /*
                  THẺ KHÔNG CÒN LÀ MỘT <Link> BỌC TẤT CẢ.

                  Ngôi sao là một <button>, mà <button> lồng trong <a> là HTML
                  không hợp lệ: trình duyệt tự gỡ rối theo kiểu riêng của mình
                  và bàn phím thì không còn tab tới được cả hai. Nên đảo lại —
                  thẻ là <div>, và <Link> phủ TOÀN MẶT thẻ bằng `absolute
                  inset-0`. Cả mặt thẻ vẫn bấm được y như cũ, chỉ khác là ngôi
                  sao nằm ở lớp trên (`z-10`) nên nó nhận cú bấm trước.

                  `group` giữ nguyên trên thẻ chứ không chuyển sang <Link>: chữ
                  "Xem ›" đổi màu theo `group-hover`, mà rê chuột ở bất kỳ đâu
                  trên thẻ đều phải kích hoạt nó.
                */
                <div
                  key={exam.id}
                  className="card group relative overflow-hidden py-7 pr-7 pl-8 transition-transform hover:-translate-y-1"
                >
                  {/* Lớp phủ bấm được. `z-0` để nó nằm dưới ngôi sao. */}
                  <Link
                    href={`/de-thi/${exam.slug}`}
                    aria-label={exam.name}
                    className="absolute inset-0 z-0"
                  />
                  {/* Dải màu tượng trưng — xem languageStripe() trong lib/enums.ts */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[6px]"
                    style={{ backgroundImage: languageStripe(exam.language as Language) }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold">
                        {exam.name}{' '}
                        <span aria-hidden="true">{LANGUAGE_FLAGS[exam.language as Language]}</span>
                      </h3>
                      <p className="mt-1 truncate text-[14px] text-muted">{exam.fullName}</p>
                    </div>
                    {/* Sao ĐỨNG SAU pill ngôn ngữ, cùng một cụm ở góc phải trên.
                        `z-10` để nó nổi lên trên lớp phủ <Link>. */}
                    <div className="relative z-10 flex flex-none items-center gap-1.5">
                      <span className="pill bg-soft text-[13.5px] text-muted-strong">
                        {LANGUAGE_LABELS[exam.language as Language]}
                      </span>
                      <FavoriteStar examId={exam.id} />
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-muted-strong">
                    {exam.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-[15px] font-medium">
                      {exam.paperCount} đề · {formatNumber(exam.attemptTotal)} lượt
                    </span>
                    <span className="flex items-center gap-1 text-[15px] font-semibold text-muted-strong transition-colors group-hover:text-ink">
                      Xem <ChevronRightIcon size={15} />
                    </span>
                  </div>
                </div>
              ))}
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
