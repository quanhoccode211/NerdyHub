import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Phòng thi và kết quả gắn với phiên cá nhân — không có giá trị index
        disallow: ['/thi/', '/ket-qua/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
