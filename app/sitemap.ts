import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { publicPaperFilter } from '@/lib/content-filter'

/**
 * Sitemap sinh động từ DB.
 * SPEC F7: chỉ chứa nội dung PUBLISHED + canPublish — đi qua publicPaperFilter,
 * không tự viết where thủ công.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const [exams, papers] = await Promise.all([
    prisma.exam.findMany({
      where: { isActive: true, papers: { some: publicPaperFilter() } },
      select: { slug: true },
    }),
    prisma.testPaper.findMany({
      where: publicPaperFilter(),
      select: { slug: true, updatedAt: true, exam: { select: { slug: true } } },
    }),
  ])

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/de-thi`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...exams.map((e) => ({
      url: `${base}/de-thi/${e.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...papers.map((p) => ({
      url: `${base}/de-thi/${p.exam.slug}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
