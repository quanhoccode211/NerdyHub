import { prisma } from '../lib/db'

/** Xoá toàn bộ lượt làm bài (giữ nguyên nội dung đề). Dùng khi test lại luồng. */
async function main() {
  await prisma.annotation.deleteMany()
  await prisma.attemptAnswer.deleteMany()
  const { count } = await prisma.attempt.deleteMany()
  await prisma.testPaper.updateMany({ data: { attemptCount: 0, avgScore: null } })
  console.log(`✓ Đã xoá ${count} lượt làm bài và reset thống kê đề`)
  await prisma.$disconnect()
}

void main()
