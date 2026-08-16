import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/app-shell'
import { StartButtons } from '@/components/catalog/start-buttons'
import { ChevronRightIcon, ClockIcon, FlagIcon } from '@/components/shell/icons'
import {
  getAvailableYears,
  getExamBySlug,
  getPapersForExam,
  getQuestionCounts,
  type PaperFilters,
} from '@/lib/queries'
import { prisma } from '@/lib/db'
import { publicPaperFilter } from '@/lib/content-filter'
import { formatDuration, formatNumber, formatScore } from '@/lib/format'
import { LANGUAGE_FLAGS, SKILL_LABELS, SKILLS, type Language, type Skill } from '@/lib/enums'

type Props = PageProps<'/de-thi/[examSlug]'>

export async function generateStaticParams() {
  const exams = await prisma.exam.findMany({
    where: { isActive: true, papers: { some: publicPaperFilter() } },
    select: { slug: true },
  })
  return exams.map((e) => ({ examSlug: e.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examSlug } = await params
  const exam = await getExamBySlug(examSlug)
  if (!exam) return {}

  const title = `Đề thi thử ${exam.name} online có bấm giờ`
  return {
    title,
    description: `Làm đề thi thử ${exam.name} (${exam.fullName}) online miễn phí, có bấm giờ như thi thật, chấm điểm tự động và phân tích điểm yếu.`,
    alternates: { canonical: `/de-thi/${exam.slug}` },
    openGraph: { title, description: exam.description, type: 'website' },
  }
}

export default async function ExamLandingPage({ params, searchParams }: Props) {
  const { examSlug } = await params
  // Bộ lọc chạy server-side qua searchParams => URL chia sẻ được, F5 giữ trạng thái (SPEC F1)
  const sp = await searchParams
  const filters: PaperFilters = {
    level: typeof sp.level === 'string' ? sp.level : undefined,
    skill: typeof sp.skill === 'string' ? sp.skill : undefined,
    year: typeof sp.year === 'string' ? sp.year : undefined,
    sort: sp.sort === 'newest' || sp.sort === 'duration' ? sp.sort : 'popular',
  }

  const exam = await getExamBySlug(examSlug)
  if (!exam) notFound()

  const [papers, years] = await Promise.all([
    getPapersForExam(exam.id, filters),
    getAvailableYears(exam.id),
  ])
  const questionCounts = await getQuestionCounts(papers.map((p) => p.id))

  // Giữ nguyên các filter khác khi đổi một filter
  const basePath = `/de-thi/${exam.slug}`
  function hrefWith(patch: Partial<PaperFilters>) {
    const q = new URLSearchParams()
    const merged = { ...filters, ...patch }
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === 'sort' && v === 'popular')) q.set(k, String(v))
    }
    const s = q.toString()
    return `${basePath}${s ? `?${s}` : ''}`
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `Đề thi thử ${exam.name}`,
    description: exam.description,
    educationalLevel: exam.levels.map((l) => l.name).join(', '),
    learningResourceType: 'Practice test',
    inLanguage: exam.language.toLowerCase(),
    isAccessibleForFree: true,
    hasPart: papers.map((p) => ({
      '@type': 'Quiz',
      name: p.title,
      url: `/de-thi/${exam.slug}/${p.slug}`,
      timeRequired: `PT${Math.round(p.totalDuration / 60)}M`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[14.5px] text-muted">
        <Link href="/de-thi" className="hover:text-ink">
          Đề thi
        </Link>
        <ChevronRightIcon size={13} />
        <span className="text-ink">{exam.name}</span>
      </nav>

      <PageHeader
        title={`Đề thi thử ${exam.name} ${LANGUAGE_FLAGS[exam.language as Language]}`}
        subtitle={exam.fullName}
        actions={
          <div className="pill bg-purple-soft text-purple">
            {papers.length} đề {filters.level || filters.skill || filters.year ? 'khớp bộ lọc' : 'khả dụng'}
          </div>
        }
      />

      <p className="panel mb-6 p-6 text-[16px] leading-relaxed text-muted-strong">{exam.description}</p>

      {/* Bộ lọc — mọi thay đổi là một link, giữ URL index được */}
      <section className="mb-6 flex flex-col gap-4" aria-label="Bộ lọc đề thi">
        {exam.levels.length > 0 && (
          <FilterRow label="Cấp độ">
            <FilterChip href={hrefWith({ level: undefined })} active={!filters.level}>
              Tất cả
            </FilterChip>
            {exam.levels.map((l) => (
              <FilterChip
                key={l.id}
                href={hrefWith({ level: l.slug })}
                active={filters.level === l.slug}
              >
                {l.name}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        <FilterRow label="Kỹ năng">
          <FilterChip href={hrefWith({ skill: undefined })} active={!filters.skill}>
            Tất cả
          </FilterChip>
          {SKILLS.filter((s) => s !== 'OTHER').map((s) => (
            <FilterChip key={s} href={hrefWith({ skill: s })} active={filters.skill === s}>
              {SKILL_LABELS[s]}
            </FilterChip>
          ))}
        </FilterRow>

        {years.length > 0 && (
          <FilterRow label="Năm">
            <FilterChip href={hrefWith({ year: undefined })} active={!filters.year}>
              Tất cả
            </FilterChip>
            {years.map((y) => (
              <FilterChip key={y} href={hrefWith({ year: String(y) })} active={filters.year === String(y)}>
                {y}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        <FilterRow label="Sắp xếp">
          <FilterChip href={hrefWith({ sort: 'popular' })} active={filters.sort === 'popular'}>
            Nhiều lượt làm
          </FilterChip>
          <FilterChip href={hrefWith({ sort: 'newest' })} active={filters.sort === 'newest'}>
            Mới nhất
          </FilterChip>
          <FilterChip href={hrefWith({ sort: 'duration' })} active={filters.sort === 'duration'}>
            Ngắn nhất
          </FilterChip>
        </FilterRow>
      </section>

      {/* Danh sách đề */}
      <section aria-label="Danh sách đề thi" className="flex flex-col gap-4">
        {papers.map((paper) => {
          const skills = [...new Set(paper.sections.map((s) => s.skill))] as Skill[]
          return (
            <article key={paper.id} className="panel flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {paper.level && (
                    <span className="pill bg-purple-soft text-purple">{paper.level.name}</span>
                  )}
                  {/* Màu chữ nâu cứng chỉ hợp với sắc kem của light mode; ở dark
                      `--color-cream` là màu xanh nên phải dùng cặp on-tone. */}
                  {paper.year && <span className="pill bg-cream text-on-tone">{paper.year}</span>}
                  {skills.map((s) => (
                    <span key={s} className="pill bg-card text-muted-strong">
                      {SKILL_LABELS[s]}
                    </span>
                  ))}
                </div>

                <h3 className="mt-3 text-[20px] font-semibold">
                  <Link href={`/de-thi/${exam.slug}/${paper.slug}`} className="hover:text-purple">
                    {paper.title}
                  </Link>
                </h3>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-muted-strong">
                  <span className="flex items-center gap-1.5">
                    <ClockIcon size={16} />
                    {formatDuration(paper.totalDuration)}
                  </span>
                  <span>{questionCounts.get(paper.id) ?? 0} câu</span>
                  <span>{paper._count.sections} phần</span>
                  <span className="flex items-center gap-1.5">
                    <FlagIcon size={13} />
                    <span>{formatNumber(paper.attemptCount)} lượt</span>
                  </span>
                  {paper.avgScore !== null && <span>TB {formatScore(paper.avgScore)}</span>}
                </div>

                {/* Attribution bắt buộc hiển thị nếu provenance yêu cầu — SPEC F1 */}
                {paper.provenance.attribution && (
                  <p className="mt-3 text-[13.5px] text-muted">Nguồn: {paper.provenance.attribution}</p>
                )}
              </div>

              <div className="flex-none lg:w-[300px]">
                <StartButtons paperId={paper.id} />
              </div>
            </article>
          )
        })}

        {papers.length === 0 && (
          <div className="panel p-10 text-center">
            <p className="text-muted">Không có đề nào khớp bộ lọc.</p>
            <Link href={`/de-thi/${exam.slug}`} className="btn-secondary mt-4 inline-flex">
              Xoá bộ lọc
            </Link>
          </div>
        )}
      </section>
    </>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[72px] flex-none text-[14.5px] font-medium text-muted">{label}</span>
      {children}
    </div>
  )
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`rounded-pill px-4 py-2 text-[14.5px] font-medium transition-colors ${
        active ? 'bg-ink text-[var(--color-accent-fg)]' : 'bg-soft text-muted-strong hover:bg-purple-soft hover:text-purple'
      }`}
    >
      {children}
    </Link>
  )
}
