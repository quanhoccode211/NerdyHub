import { prisma } from '../lib/db'

/**
 * Kiểm chứng chốt chặn provenance.canPublish (SPEC mục 3.1 + acceptance F8).
 * Đề RESTRICTED phải không mở được phòng thi kể cả khi gọi thẳng API.
 */
async function main() {
  const restricted = await prisma.testPaper.findFirst({
    where: { provenance: { canPublish: false } },
    include: { provenance: true, exam: true },
  })
  if (!restricted) {
    console.error('✗ Không tìm thấy đề RESTRICTED trong seed — không kiểm chứng được')
    process.exit(1)
  }

  console.log(`Đề bị hạn chế: "${restricted.title}"`)
  console.log(`  status      = ${restricted.status}  (cố ý để PUBLISHED)`)
  console.log(`  canPublish  = ${restricted.provenance.canPublish}`)
  console.log(`  id          = ${restricted.id}\n`)

  const base = process.env.BASE_URL ?? 'http://localhost:3000'
  const checks: { name: string; ok: boolean; detail: string }[] = []

  // 1. Trang chi tiết đề phải 404
  const pageRes = await fetch(`${base}/de-thi/${restricted.exam.slug}/${restricted.slug}`)
  checks.push({
    name: 'Trang chi tiết đề',
    ok: pageRes.status === 404,
    detail: `HTTP ${pageRes.status} (mong đợi 404)`,
  })

  // 2. Gọi thẳng API tạo lượt làm phải bị chặn
  const apiRes = await fetch(`${base}/api/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperId: restricted.id, mode: 'EXAM' }),
  })
  checks.push({
    name: 'POST /api/attempts (gọi trực tiếp)',
    ok: apiRes.status === 404,
    detail: `HTTP ${apiRes.status} (mong đợi 404)`,
  })

  // 3. Sitemap không được chứa đề này
  const sitemap = await fetch(`${base}/sitemap.xml`).then((r) => r.text())
  checks.push({
    name: 'Sitemap',
    ok: !sitemap.includes(restricted.slug),
    detail: sitemap.includes(restricted.slug) ? 'CÓ trong sitemap' : 'không có trong sitemap',
  })

  // 4. Danh sách đề của kỳ thi không được chứa
  const listing = await fetch(`${base}/de-thi/${restricted.exam.slug}`).then((r) => r.text())
  checks.push({
    name: 'Danh sách đề',
    ok: !listing.includes(restricted.slug),
    detail: listing.includes(restricted.slug) ? 'CÓ trong danh sách' : 'không xuất hiện',
  })

  let failed = 0
  for (const c of checks) {
    console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`)
    if (!c.ok) failed++
  }

  console.log(
    failed === 0
      ? '\n✓ Content filter giữ được ở mọi lối vào đã kiểm tra'
      : `\n✗ ${failed} lối vào bị rò rỉ`,
  )
  await prisma.$disconnect()
  process.exit(failed === 0 ? 0 : 1)
}

void main()
