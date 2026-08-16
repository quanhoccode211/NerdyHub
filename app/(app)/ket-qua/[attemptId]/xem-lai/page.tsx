import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/app-shell'
import { ReviewView } from '@/components/exam-room/review-view'
import { loadExamRoom } from '@/lib/attempt-service'
import { prisma } from '@/lib/db'
import { getIdentity, ownsAttempt } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Xem lại bài làm',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = PageProps<'/ket-qua/[attemptId]/xem-lai'>

export default async function ReviewPage({ params, searchParams }: Props) {
  const { attemptId } = await params
  const sp = await searchParams
  const { userId, guestId } = await getIdentity()

  const owner = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { userId: true, guestId: true, status: true },
  })
  if (!owner) notFound()
  if (!ownsAttempt(owner, { userId, guestId })) notFound()
  // Chưa nộp thì không có gì để xem lại — và không được lộ đáp án
  if (owner.status !== 'SUBMITTED') notFound()

  const data = await loadExamRoom(attemptId, true)
  if (!data) notFound()

  const filterParam = typeof sp.loc === 'string' ? sp.loc : undefined
  const initialFilter =
    filterParam === 'sai' ? 'wrong' : filterParam === 'danh-dau' ? 'flagged' : 'all'

  return (
    <>
      <PageHeader
        title="Xem lại bài làm"
        subtitle={`${data.paper.title} — đáp án đúng, giải thích và ghi chú của bạn`}
      />
      <ReviewView data={data} initialFilter={initialFilter} />
    </>
  )
}
