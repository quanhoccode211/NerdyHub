import { prisma } from '../lib/db'
import { purgeExpiredAccounts, PURGE_DELAY_HOURS } from '../lib/auth/data-rights'

/**
 * Job xoá cứng tài khoản đã quá hạn 48 giờ (SPEC F6).
 * Chạy định kỳ trên production; ở local chạy tay: npm run purge:users
 *
 * `--dry` chỉ liệt kê, không xoá.
 */
async function main() {
  const dryRun = process.argv.includes('--dry')
  const now = new Date()

  const pending = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, email: true, deletedAt: true, purgeAfter: true },
  })

  if (pending.length === 0) {
    console.log('Không có tài khoản nào đang chờ xoá.')
    await prisma.$disconnect()
    return
  }

  console.log(`Đang chờ xoá: ${pending.length} tài khoản (hạn ${PURGE_DELAY_HOURS} giờ)\n`)
  for (const u of pending) {
    const due = u.purgeAfter !== null && u.purgeAfter <= now
    const remaining = u.purgeAfter
      ? Math.max(0, Math.round((u.purgeAfter.getTime() - now.getTime()) / 60000))
      : 0
    console.log(
      `  ${due ? '→ ĐẾN HẠN' : '  còn ' + remaining + ' phút'}  ${u.email}  (yêu cầu lúc ${u.deletedAt?.toISOString()})`,
    )
  }

  if (dryRun) {
    console.log('\n--dry: không xoá gì.')
    await prisma.$disconnect()
    return
  }

  const purged = await purgeExpiredAccounts(now)
  console.log(
    purged.length > 0
      ? `\n✓ Đã xoá vĩnh viễn ${purged.length} tài khoản và toàn bộ dữ liệu liên quan`
      : '\n· Chưa tài khoản nào tới hạn',
  )

  await prisma.$disconnect()
}

void main()
