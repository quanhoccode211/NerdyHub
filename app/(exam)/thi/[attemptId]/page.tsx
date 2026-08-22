import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ExamRoom } from '@/components/exam-room/exam-room'
import { loadExamRoom, overdueSeconds } from '@/lib/attempt-service'
import { prisma } from '@/lib/db'
import { getIdentity, ownsAttempt } from '@/lib/session'
import { scoreAttempt } from '@/lib/scoring'

export const metadata: Metadata = {
  title: 'Phòng thi',
  robots: { index: false, follow: false },
}

// Phòng thi luôn động: đồng hồ và trạng thái bài làm không được cache
export const dynamic = 'force-dynamic'

type Props = PageProps<'/thi/[attemptId]'>

export default async function ExamRoomPage({ params }: Props) {
  const { attemptId } = await params
  const { userId, guestId } = await getIdentity()

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, guestId: true, status: true, expiresAt: true, mode: true },
  })
  if (!attempt) notFound()

  // Attempt gắn với phiên của người tạo — không cho người khác mở bằng link
  if (!ownsAttempt(attempt, { userId, guestId })) notFound()

  if (attempt.status === 'SUBMITTED') redirect(`/ket-qua/${attemptId}`)

  // Vào lại sau khi đã hết giờ (đóng tab, mất điện…): chấm luôn rồi sang kết quả.
  // Không cho làm tiếp, đúng nguyên tắc "hết giờ là nộp".
  //
  // Đây là Server Component chạy một lần cho mỗi request, không phải render phía
  // client — đọc đồng hồ ở đây chính là điều cần làm. `overdueSeconds` dùng chung
  // với route sync để hai đường không thể bất đồng về việc "hết giờ chưa".
  if (overdueSeconds(attempt) > 0) {
    await scoreAttempt(attemptId, { autoSubmitted: true })
    redirect(`/ket-qua/${attemptId}`)
  }

  const data = await loadExamRoom(attemptId, false)
  if (!data) notFound()

  return <ExamRoom data={data} />
}
