import { prisma } from './db'
import { publicPaperFilter, withPublicPaperFilter } from './content-filter'
import type { Prisma } from './generated/prisma/client'

/**
 * Truy vấn nội dung công khai. Mọi hàm ở đây đã áp content filter.
 * Trang public KHÔNG được gọi thẳng prisma — gọi qua module này.
 */

export type PaperFilters = {
  level?: string
  skill?: string
  year?: string
  sort?: 'popular' | 'newest' | 'duration'
}

/** Danh sách kỳ thi + số đề công khai của mỗi kỳ. */
export async function getExamsWithCounts() {
  const exams = await prisma.exam.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      levels: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { papers: { where: publicPaperFilter() } } },
    },
  })

  // Tổng lượt làm để hiển thị trên thẻ kỳ thi
  const attemptTotals = await prisma.testPaper.groupBy({
    by: ['examId'],
    where: publicPaperFilter(),
    _sum: { attemptCount: true },
  })
  const totals = new Map(attemptTotals.map((t) => [t.examId, t._sum.attemptCount ?? 0]))

  return exams.map((e) => ({
    ...e,
    paperCount: e._count.papers,
    attemptTotal: totals.get(e.id) ?? 0,
  }))
}

export async function getExamBySlug(slug: string) {
  return prisma.exam.findFirst({
    where: { slug, isActive: true },
    include: { levels: { orderBy: { sortOrder: 'asc' } } },
  })
}

/** Đề của một kỳ thi, đã lọc công khai + áp bộ lọc từ searchParams. */
export async function getPapersForExam(examId: string, filters: PaperFilters) {
  const where: Prisma.TestPaperWhereInput = { examId }

  if (filters.level) where.level = { slug: filters.level }
  if (filters.year) {
    const y = Number.parseInt(filters.year, 10)
    if (Number.isFinite(y)) where.year = y
  }
  // Lọc theo kỹ năng: đề phải chứa ít nhất một section thuộc kỹ năng đó
  if (filters.skill) where.sections = { some: { skill: filters.skill } }

  const orderBy: Prisma.TestPaperOrderByWithRelationInput | Prisma.TestPaperOrderByWithRelationInput[] =
    filters.sort === 'newest'
      ? [{ year: 'desc' }, { publishedAt: 'desc' }]
      : filters.sort === 'duration'
        ? { totalDuration: 'asc' }
        : { attemptCount: 'desc' }

  return prisma.testPaper.findMany({
    where: withPublicPaperFilter(where),
    orderBy,
    include: {
      level: true,
      provenance: { select: { attribution: true, sourceName: true } },
      sections: { select: { skill: true, duration: true }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { sections: true } },
    },
  })
}

/** Số câu hỏi của từng đề (dùng cho danh sách). */
export async function getQuestionCounts(paperIds: string[]): Promise<Map<string, number>> {
  if (paperIds.length === 0) return new Map()
  const rows = await prisma.question.groupBy({
    by: ['sectionId'],
    where: { section: { paperId: { in: paperIds } } },
    _count: { _all: true },
  })
  const sections = await prisma.section.findMany({
    where: { paperId: { in: paperIds } },
    select: { id: true, paperId: true },
  })
  const sectionToPaper = new Map(sections.map((s) => [s.id, s.paperId]))
  const counts = new Map<string, number>()
  for (const r of rows) {
    const paperId = sectionToPaper.get(r.sectionId)
    if (!paperId) continue
    counts.set(paperId, (counts.get(paperId) ?? 0) + r._count._all)
  }
  return counts
}

/**
 * Chi tiết một đề cho trang giới thiệu — KHÔNG kèm đáp án.
 * Trả null nếu đề không đủ điều kiện public (status hoặc canPublish).
 */
export async function getPublicPaper(examSlug: string, paperSlug: string) {
  const paper = await prisma.testPaper.findFirst({
    where: withPublicPaperFilter({ slug: paperSlug, exam: { slug: examSlug } }),
    include: {
      exam: true,
      level: true,
      provenance: true,
      sections: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          skill: true,
          title: true,
          instructions: true,
          duration: true,
          audioUrl: true,
          audioPlayMode: true,
          sortOrder: true,
          _count: { select: { questions: true } },
        },
      },
    },
  })
  return paper
}

/** Các đề khác cùng kỳ thi — dùng cho gợi ý cuối trang. */
export async function getRelatedPapers(examId: string, excludePaperId: string, take = 3) {
  return prisma.testPaper.findMany({
    where: withPublicPaperFilter({ examId, id: { not: excludePaperId } }),
    orderBy: { attemptCount: 'desc' },
    take,
    include: { level: true },
  })
}

/** Các năm có đề, cho dropdown bộ lọc. */
export async function getAvailableYears(examId: string): Promise<number[]> {
  const rows = await prisma.testPaper.findMany({
    where: withPublicPaperFilter({ examId, year: { not: null } }),
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' },
  })
  return rows.map((r) => r.year).filter((y): y is number => y !== null)
}

/** Thống kê tổng trang chủ. */
export async function getSiteStats() {
  const [paperCount, questionCount, attemptAgg] = await Promise.all([
    prisma.testPaper.count({ where: publicPaperFilter() }),
    prisma.question.count({
      where: { section: { paper: publicPaperFilter() }, provenance: { canPublish: true } },
    }),
    prisma.testPaper.aggregate({ where: publicPaperFilter(), _sum: { attemptCount: true } }),
  ])
  return {
    paperCount,
    questionCount,
    attemptTotal: attemptAgg._sum.attemptCount ?? 0,
  }
}
