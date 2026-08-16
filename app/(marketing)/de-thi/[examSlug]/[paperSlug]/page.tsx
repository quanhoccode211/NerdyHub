import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/app-shell'
import { StartButtons } from '@/components/catalog/start-buttons'
import { ChevronRightIcon, FlagIcon, LockIcon, WarningIcon } from '@/components/shell/icons'
import { getPublicPaper, getRelatedPapers } from '@/lib/queries'
import { prisma } from '@/lib/db'
import { publicPaperFilter } from '@/lib/content-filter'
import { formatDuration, formatNumber, formatScore } from '@/lib/format'
import { SKILL_LABELS, type Skill } from '@/lib/enums'

type Props = PageProps<'/de-thi/[examSlug]/[paperSlug]'>

export async function generateStaticParams() {
  const papers = await prisma.testPaper.findMany({
    where: publicPaperFilter(),
    select: { slug: true, exam: { select: { slug: true } } },
  })
  return papers.map((p) => ({ examSlug: p.exam.slug, paperSlug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug, paperSlug } = await params
  const paper = await getPublicPaper(examSlug, paperSlug)
  if (!paper) return {}

  const questionCount = paper.sections.reduce((sum, s) => sum + s._count.questions, 0)
  const title = `${paper.title} — làm online có bấm giờ`
  const description = `Làm ${paper.title} online miễn phí: ${questionCount} câu, ${formatDuration(
    paper.totalDuration,
  )}, chấm điểm tự động ngay khi nộp.`

  return {
    title,
    description,
    alternates: { canonical: `/de-thi/${examSlug}/${paperSlug}` },
    openGraph: { title, description, type: 'article' },
  }
}

export default async function PaperDetailPage({ params }: Props) {
  const { examSlug, paperSlug } = await params

  // getPublicPaper đã áp content filter: đề RESTRICTED trả null -> 404
  const paper = await getPublicPaper(examSlug, paperSlug)
  if (!paper) notFound()

  const related = await getRelatedPapers(paper.examId, paper.id)
  const questionCount = paper.sections.reduce((sum, s) => sum + s._count.questions, 0)
  // Chỉ tính section CÓ audio — audioPlayMode có giá trị mặc định kể cả khi không có file
  const hasStrictAudio = paper.sections.some(
    (s) => s.audioUrl !== null && s.audioPlayMode === 'ONCE_NO_SEEK',
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: paper.title,
    educationalAlignment: {
      '@type': 'AlignmentObject',
      alignmentType: 'assesses',
      targetName: paper.exam.name,
    },
    numberOfQuestions: questionCount,
    timeRequired: `PT${Math.round(paper.totalDuration / 60)}M`,
    isAccessibleForFree: true,
    inLanguage: paper.exam.language.toLowerCase(),
    ...(paper.provenance.attribution ? { creditText: paper.provenance.attribution } : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Đề thi', item: '/de-thi' },
      { '@type': 'ListItem', position: 2, name: paper.exam.name, item: `/de-thi/${examSlug}` },
      { '@type': 'ListItem', position: 3, name: paper.title, item: `/de-thi/${examSlug}/${paperSlug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]) }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-[14.5px] text-muted">
        <Link href="/de-thi" className="hover:text-ink">
          Đề thi
        </Link>
        <ChevronRightIcon size={13} />
        <Link href={`/de-thi/${examSlug}`} className="hover:text-ink">
          {paper.exam.name}
        </Link>
        <ChevronRightIcon size={13} />
        <span className="truncate text-ink">{paper.title}</span>
      </nav>

      <PageHeader
        title={paper.title}
        subtitle={`${paper.exam.fullName}${paper.level ? ` · ${paper.level.name}` : ''}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Cấu trúc đề */}
        <section aria-labelledby="cau-truc">
          <h2 id="cau-truc" className="mb-4 text-[23px] font-bold">
            Cấu trúc đề
          </h2>

          <div className="flex flex-col gap-4">
            {paper.sections.map((section, i) => (
              <article key={section.id} className="panel p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-soft text-[15px] font-bold text-purple">
                    {i + 1}
                  </span>
                  <span className="pill bg-white text-muted-strong">
                    {SKILL_LABELS[section.skill as Skill]}
                  </span>
                  {section.audioUrl !== null && section.audioPlayMode === 'ONCE_NO_SEEK' && (
                    <span className="pill bg-amber-soft text-amber">
                      <LockIcon size={13} /> Audio phát 1 lần
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-[18px] font-semibold">{section.title}</h3>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-muted-strong">
                  {section.instructions}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14.5px] text-muted">
                  <span>{section._count.questions} câu</span>
                  <span>{formatDuration(section.duration)}</span>
                </div>
              </article>
            ))}
          </div>

          {hasStrictAudio && (
            <div className="mt-5 flex items-start gap-3 rounded-card bg-amber-soft p-5 text-amber">
              <WarningIcon size={20} />
              <p className="text-[15px] leading-relaxed">
                Ở chế độ <strong>Thi thật</strong>, audio của phần Nghe chỉ phát <strong>một lần</strong> và
                không tua được — đúng như phòng thi. Chọn <strong>Luyện tập</strong> nếu bạn muốn nghe lại.
              </p>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-9" aria-labelledby="de-khac">
              <h2 id="de-khac" className="mb-4 text-[23px] font-bold">
                Đề khác cùng kỳ thi
              </h2>
              <div className="flex flex-col gap-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/de-thi/${examSlug}/${r.slug}`}
                    className="panel flex items-center justify-between gap-4 p-5 transition-colors hover:bg-purple-soft"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[17px] font-medium">{r.title}</div>
                      <div className="mt-1 text-[14px] text-muted">
                        {r.level?.name ?? '—'} · {formatDuration(r.totalDuration)}
                      </div>
                    </div>
                    <ChevronRightIcon />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>

        {/* Panel bắt đầu */}
        <aside className="lg:sticky lg:top-6">
          <div className="rounded-card bg-lime p-7 text-on-tone">
            <div className="grid grid-cols-2 gap-y-5">
              <Stat label="Thời lượng" value={formatDuration(paper.totalDuration)} />
              <Stat label="Số câu" value={`${questionCount} câu`} />
              <Stat label="Số phần" value={`${paper.sections.length} phần`} />
              <Stat label="Lượt làm" value={formatNumber(paper.attemptCount)} />
              {paper.avgScore !== null && (
                <Stat label="Điểm trung bình" value={formatScore(paper.avgScore)} />
              )}
              {paper.year && <Stat label="Năm" value={String(paper.year)} />}
            </div>

            <div className="mt-6 border-t border-on-tone/15 pt-6">
              <StartButtons paperId={paper.id} />
            </div>

            <p className="mt-4 flex items-center gap-2 text-[13.5px] text-on-tone/55">
              <FlagIcon size={12} />
              Không cần đăng nhập. Bài làm được lưu tự động.
            </p>
          </div>

          {/* Provenance — bắt buộc hiển thị khi có attribution */}
          <div className="panel mt-5 p-6">
            <h3 className="text-[16px] font-semibold">Nguồn nội dung</h3>
            <dl className="mt-3 flex flex-col gap-2 text-[14.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Đơn vị</dt>
                <dd className="text-right font-medium">{paper.provenance.sourceName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Giấy phép</dt>
                <dd className="text-right font-medium">{paper.provenance.license}</dd>
              </div>
            </dl>
            {paper.provenance.attribution && (
              <p className="mt-3 border-t border-line pt-3 text-[13.5px] leading-relaxed text-muted">
                {paper.provenance.attribution}
              </p>
            )}
            {paper.provenance.sourceUrl && (
              <a
                href={paper.provenance.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 inline-block text-[13.5px] font-medium text-purple hover:underline"
              >
                Xem nguồn gốc ↗
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[14px] text-on-tone/55">{label}</div>
      <div className="mt-0.5 text-[18px] font-semibold">{value}</div>
    </div>
  )
}
