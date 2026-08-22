/**
 * Lọc HTML của mọi Passage đang nằm trong database, ghi đè tại chỗ.
 *
 * Vì sao cần: phòng thi trước đây sanitize ở mỗi lần đọc, nhưng DOMPurify kéo
 * theo jsdom và jsdom không nạp được trong hàm serverless của Vercel (xem ghi
 * chú ở lib/attempt-service.ts). Lọc chuyển sang đường GHI, và đây là lượt lọc
 * cho nội dung đã seed từ trước.
 *
 * CHẠY LẠI SAU MỖI LẦN NẠP ĐỀ MỚI:
 *   npm run sanitize:passages
 *
 * Idempotent: chạy bao nhiêu lần cũng ra cùng kết quả, chỉ UPDATE đúng dòng
 * thực sự đổi. `--dry` để xem trước mà không ghi.
 */
import { prisma } from '../lib/db'
import { sanitizeHtml } from '../lib/sanitize-html'

async function main() {
  const dry = process.argv.includes('--dry')

  const passages = await prisma.passage.findMany({
    select: { id: true, title: true, content: true },
  })

  let changed = 0
  for (const p of passages) {
    const clean = sanitizeHtml(p.content)
    if (clean === p.content) continue

    changed++
    console.log(
      `${dry ? '[thử] ' : ''}${p.title ?? p.id}: ${p.content.length} -> ${clean.length} ký tự`,
    )
    if (!dry) {
      await prisma.passage.update({ where: { id: p.id }, data: { content: clean } })
    }
  }

  console.log(
    `\n${passages.length} passage, ${changed} cần lọc${dry ? ' (chưa ghi gì)' : ', đã ghi'}.`,
  )
  await prisma.$disconnect()
}

main()
