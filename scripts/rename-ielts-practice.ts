/**
 * Đổi tên bốn đề IELTS chép từ sách sang "Practice C1–C4", và gỡ tên nhà xuất
 * bản khỏi những trường CÓ HIỂN THỊ trên giao diện.
 *
 * Vì sao phải có script riêng: `db:seed` mở đầu bằng một loạt `deleteMany()`
 * rồi dựng lại toàn bộ nội dung — chạy nó lên database mà bản chạy thật đang
 * đọc là xoá đề của mọi kỳ thi khác cùng mọi lượt làm bài trỏ tới chúng. Script
 * này chỉ UPDATE đúng bốn hàng đề và một hàng provenance.
 *
 *   npx tsx scripts/rename-ielts-practice.ts        # xem trước, không ghi
 *   npx tsx scripts/rename-ielts-practice.ts --write
 *
 * Idempotent: chạy lại lần hai không đổi gì thêm.
 *
 * SAU KHI CHẠY PHẢI BUILD LẠI. `/de-thi/[examSlug]/[paperSlug]` dựng bằng
 * `generateStaticParams` lúc build, nên slug mới chưa có đường dẫn trên bản đã
 * deploy — và slug cũ thì vẫn còn đó, trỏ vào một đề không còn tồn tại.
 */
import { prisma } from '../lib/db'

/** Nguồn thật vẫn ghi đủ ở `notes` — trường đó không render ở đâu cả. */
const NEUTRAL = {
  sourceName: 'Sách luyện thi quốc tế',
  attribution: 'Đề từ sách luyện thi quốc tế. Nội dung thuộc bản quyền nhà xuất bản.',
}

/** slug cũ -> số thứ tự đề. Khoá theo slug chứ không theo tiêu đề: tiêu đề là
    thứ script này đổi, chạy lại lần hai sẽ không khớp nữa. */
const RENAMES = [1, 2, 3, 4].map((n) => ({
  from: `academic-reading-cambridge-test-${n}`,
  to: `academic-reading-practice-c${n}`,
  title: `IELTS Academic Reading — Practice C${n}`,
}))

async function main() {
  const write = process.argv.includes('--write')
  if (!write) console.log('— CHẠY THỬ, không ghi gì. Thêm --write để áp dụng. —\n')

  const exam = await prisma.exam.findUnique({ where: { slug: 'ielts' }, select: { id: true } })
  if (!exam) throw new Error('Không tìm thấy kỳ thi ielts')

  let changed = 0

  for (const r of RENAMES) {
    const paper = await prisma.testPaper.findFirst({
      where: { examId: exam.id, slug: { in: [r.from, r.to] } },
      select: { id: true, slug: true, title: true },
    })
    if (!paper) {
      console.log(`· ${r.from}: không có trong database, bỏ qua.`)
      continue
    }
    if (paper.slug === r.to && paper.title === r.title) {
      console.log(`· ${r.to}: đã đúng tên, bỏ qua.`)
      continue
    }

    console.log(`✎ ${paper.slug} -> ${r.to}`)
    console.log(`  "${paper.title}" -> "${r.title}"`)
    changed++
    if (write) {
      await prisma.testPaper.update({
        where: { id: paper.id },
        data: { slug: r.to, title: r.title },
      })
    }
  }

  /*
    Provenance dùng CHUNG cho cả bốn đề (xem ghi chú ở scripts/seed-ielts.ts),
    nên tìm theo đúng hàng đang gắn với chúng thay vì đoán theo tên — tên là
    thứ sắp bị đổi.

    Tra CẢ slug cũ LẪN slug mới: ở lần chạy thử thì đề chưa đổi tên nên chỉ có
    slug cũ tồn tại, còn sau khi ghi thì chỉ còn slug mới. Chỉ liệt kê một phía
    là một trong hai lần chạy không tìm thấy gì.
  */
  const prov = await prisma.provenance.findFirst({
    where: {
      papers: {
        some: {
          examId: exam.id,
          slug: { in: RENAMES.flatMap((r) => [r.from, r.to]) },
        },
      },
    },
    select: { id: true, sourceName: true, attribution: true, notes: true },
  })

  if (!prov) {
    console.log('· Không tìm thấy provenance của bốn đề, bỏ qua phần nguồn.')
  } else if (prov.sourceName === NEUTRAL.sourceName && prov.attribution === NEUTRAL.attribution) {
    console.log('· Nguồn: đã trung tính, bỏ qua.')
  } else {
    console.log(`✎ Nguồn: "${prov.sourceName}" -> "${NEUTRAL.sourceName}"`)
    console.log(`✎ Ghi công: "${prov.attribution}" -> "${NEUTRAL.attribution}"`)
    changed++
    if (write) {
      await prisma.provenance.update({
        where: { id: prov.id },
        data: {
          ...NEUTRAL,
          /* Tên thật chuyển vào `notes` nếu chưa có ở đó — gỡ khỏi UI không có
             nghĩa là quên mất nội dung này của ai. */
          notes: prov.notes?.includes('Cambridge')
            ? prov.notes
            : `${prov.notes ?? ''}\nNguồn thật: Cambridge IELTS (Cambridge University Press).`.trim(),
        },
      })
    }
  }

  console.log(
    `\n${changed} thay đổi${write ? ' đã ghi.' : ' sẽ ghi. Chạy lại với --write để áp dụng.'}`,
  )
  if (write && changed > 0) {
    console.log('Nhớ BUILD LẠI: đường dẫn đề dựng sẵn lúc build.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
