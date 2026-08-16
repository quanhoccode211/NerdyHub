import { prisma } from '../lib/db'
import {
  PURGE_DELAY_HOURS,
  purgeExpiredAccounts,
  requestAccountDeletion,
} from '../lib/auth/data-rights'
import { hashPassword } from '../lib/auth/password'

/**
 * Kiểm chứng cam kết xoá dữ liệu của SPEC F6:
 *   "Yêu cầu xoá tài khoản xoá sạch dữ liệu trong 48h, có job kiểm chứng"
 *
 * Tạo một tài khoản dùng một lần kèm bài làm, chạy đủ vòng đời xoá, và khẳng
 * định rằng KHÔNG còn dòng dữ liệu nào sót lại ở bất kỳ bảng liên quan nào.
 */

const EMAIL = `sla-test-${Date.now()}@example.com`

function assert(cond: boolean, label: string) {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) process.exitCode = 1
  return cond
}

async function main() {
  console.log(`Cam kết: xoá cứng sau ${PURGE_DELAY_HOURS} giờ\n`)

  // --- Dựng dữ liệu ---------------------------------------------------------
  const paper = await prisma.testPaper.findFirst({
    where: { status: 'PUBLISHED', provenance: { canPublish: true } },
    include: { sections: { include: { questions: { take: 1 } } } },
  })
  if (!paper) throw new Error('Không có đề nào để test — chạy npm run db:seed trước')

  const question = paper.sections.flatMap((s) => s.questions)[0]

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Tài khoản kiểm thử SLA',
      passwordHash: await hashPassword('matkhau123456'),
      birthDate: new Date('1995-01-01'),
      consents: { create: [{ purpose: 'SERVICE_ESSENTIAL', granted: true }] },
      attempts: {
        create: {
          paperId: paper.id,
          mode: 'PRACTICE',
          status: 'SUBMITTED',
          expiresAt: new Date(Date.now() + 3_600_000),
          scaledScore: 7,
          answers: question
            ? { create: [{ questionId: question.id, textAnswer: 'dữ liệu cá nhân' }] }
            : undefined,
          annotations: {
            create: [
              {
                targetType: 'passage',
                targetId: 'x',
                type: 'NOTE',
                noteContent: 'ghi chú riêng tư',
              },
            ],
          },
        },
      },
    },
    include: { attempts: true },
  })
  const attemptId = user.attempts[0].id
  console.log(`Đã tạo ${EMAIL} kèm 1 bài làm, 1 đáp án, 1 ghi chú\n`)

  // --- Yêu cầu xoá ----------------------------------------------------------
  const { purgeAfter } = await requestAccountDeletion(user.id)
  const soft = await prisma.user.findUnique({
    where: { id: user.id },
    select: { deletedAt: true, purgeAfter: true },
  })

  assert(soft?.deletedAt !== null, 'Soft delete có hiệu lực ngay')
  const hoursDiff = purgeAfter.getTime() - (soft?.deletedAt?.getTime() ?? 0)
  assert(
    Math.abs(hoursDiff - PURGE_DELAY_HOURS * 3_600_000) < 5_000,
    `Hẹn xoá cứng đúng ${PURGE_DELAY_HOURS} giờ sau`,
  )

  // --- Chưa tới hạn thì KHÔNG được xoá --------------------------------------
  const earlyPurge = await purgeExpiredAccounts(new Date())
  assert(!earlyPurge.includes(user.id), 'Chưa tới hạn thì job không xoá')
  assert(
    (await prisma.user.count({ where: { id: user.id } })) === 1,
    'Dữ liệu còn nguyên trong thời gian chờ (người dùng đổi ý được)',
  )

  // --- Tua tới sau 48 giờ ---------------------------------------------------
  const after = new Date(purgeAfter.getTime() + 60_000)
  const purged = await purgeExpiredAccounts(after)
  assert(purged.includes(user.id), 'Quá hạn thì job xoá cứng')

  // --- Không được sót gì ----------------------------------------------------
  const [users, consents, attempts, answers, annotations, tokens, accounts] = await Promise.all([
    prisma.user.count({ where: { id: user.id } }),
    prisma.consent.count({ where: { userId: user.id } }),
    prisma.attempt.count({ where: { id: attemptId } }),
    prisma.attemptAnswer.count({ where: { attemptId } }),
    prisma.annotation.count({ where: { attemptId } }),
    prisma.guardianConsentToken.count({ where: { userId: user.id } }),
    prisma.account.count({ where: { userId: user.id } }),
  ])

  assert(users === 0, 'Bảng User: sạch')
  assert(consents === 0, 'Bảng Consent: sạch')
  assert(attempts === 0, 'Bảng Attempt: sạch')
  assert(answers === 0, 'Bảng AttemptAnswer: sạch')
  assert(annotations === 0, 'Bảng Annotation: sạch (ghi chú riêng tư đã biến mất)')
  assert(tokens === 0, 'Bảng GuardianConsentToken: sạch')
  assert(accounts === 0, 'Bảng Account: sạch')

  console.log(
    process.exitCode === 1
      ? '\n✗ Cam kết xoá dữ liệu KHÔNG được đảm bảo'
      : '\n✓ Cam kết xoá dữ liệu trong 48h được đảm bảo ở mọi bảng',
  )
  await prisma.$disconnect()
}

void main()
