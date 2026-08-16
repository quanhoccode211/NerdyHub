import { prisma } from '../lib/db'

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isMinor: true,
      guardianConsent: true,
      guardianEmail: true,
      deletedAt: true,
      purgeAfter: true,
      birthDate: true,
      consents: { select: { purpose: true, granted: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log('=== USERS ===')
  console.log(JSON.stringify(users, null, 2))

  const attempts = await prisma.attempt.findMany({
    select: { id: true, guestId: true, userId: true, status: true, scaledScore: true },
    orderBy: { startedAt: 'desc' },
    take: 10,
  })
  console.log('\n=== ATTEMPTS (10 gần nhất) ===')
  console.log(JSON.stringify(attempts, null, 2))

  await prisma.$disconnect()
}

void main()
