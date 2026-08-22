import { prisma } from '../lib/db'
import { GRACE_SEC } from '../lib/exam-clock'
import { getAttemptResult } from '../lib/results'
import { computePercentile, scoreAttempt } from '../lib/scoring'
import { publicQuestionFilter } from '../lib/content-filter'

/**
 * Kiểm chứng các BẤT BIẾN của luồng chấm điểm và thống kê.
 *
 * Vì sao là script chứ không phải thao tác tay trong trình duyệt: toàn bộ nhóm lỗi
 * "số liệu sai" (B2–B5 trong docs/kiem-tra-phong-thi.md) nằm ở logic thuần server và
 * chỉ lộ ra ở những trạng thái khó dựng bằng tay — câu gắn cờ nhưng bỏ trống, câu tự
 * luận không có dòng answer, lượt thi bỏ dở 24 giờ, đề chỉ có đúng một người làm.
 * Dựng thẳng trong DB thì mỗi lần chạy chỉ mất vài giây và lặp lại được.
 *
 * Script TỰ DỌN: mọi thứ nó tạo ra đều mang tiền tố CHECK_TAG và bị xoá ở cuối, kể
 * cả khi có khẳng định thất bại.
 *
 *   npm run check:exam-flow
 */

const CHECK_TAG = '__check_exam_flow__'

const checks: { name: string; ok: boolean; detail: string }[] = []

function expect(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail })
}

/** Lượt thi dựng sẵn ở một trạng thái cụ thể, gắn guestId để không đụng dữ liệu thật. */
async function makeAttempt(paperId: string, opts: { startedMinutesAgo?: number; durationSec: number }) {
  const startedAt = new Date(Date.now() - (opts.startedMinutesAgo ?? 0) * 60_000)
  return prisma.attempt.create({
    data: {
      paperId,
      guestId: CHECK_TAG,
      mode: 'EXAM',
      status: 'IN_PROGRESS',
      startedAt,
      expiresAt: new Date(startedAt.getTime() + opts.durationSec * 1000),
    },
  })
}

async function main() {
  /*
    Ưu tiên đề CÓ CÂU TỰ LUẬN. Khẳng định về `ungraded` chỉ có ý nghĩa khi đề thật
    sự chứa ESSAY — chạy nó trên đề toàn trắc nghiệm thì `0 === 0` luôn
    đúng và không kiểm chứng được gì.
  */
  const papers = await prisma.testPaper.findMany({
    where: { status: 'PUBLISHED', provenance: { canPublish: true } },
    include: { sections: { include: { questions: { include: { choices: true } } } } },
  })
  if (papers.length === 0) {
    console.error('✗ Không tìm thấy đề công khai nào — chạy `npm run db:seed` trước')
    process.exit(1)
  }

  const essayCount = (p: (typeof papers)[number]) =>
    p.sections.flatMap((s) => s.questions).filter((q) => q.type === 'ESSAY')
      .length
  const paper = [...papers].sort((a, b) => essayCount(b) - essayCount(a))[0]

  const questions = paper.sections.flatMap((s) => s.questions)
  const graded = questions.filter((q) => q.type !== 'ESSAY')
  const essays = questions.filter((q) => q.type === 'ESSAY')
  const mcq = graded.filter((q) => q.choices.length > 0)

  console.log(`Đề dùng để kiểm: "${paper.title}"`)
  console.log(`  ${questions.length} câu — ${graded.length} chấm được, ${essays.length} tự luận\n`)

  if (mcq.length < 2) {
    console.error('✗ Đề mẫu cần ít nhất 2 câu trắc nghiệm để dựng được các trạng thái')
    process.exit(1)
  }

  // ---- 1. Câu GẮN CỜ nhưng BỎ TRỐNG (B2) -----------------------------------
  // Gắn cờ sinh ra một dòng AttemptAnswer với lựa chọn rỗng. Bản cũ đếm "bỏ trống"
  // theo SỐ DÒNG nên câu này lọt sang "Sai", kèm cả nội dung vào danh sách cần ôn.
  const a1 = await makeAttempt(paper.id, { durationSec: paper.totalDuration })
  const flaggedBlank = mcq[0]
  const answeredRight = mcq[1]
  const correctChoice = answeredRight.choices.find((c) => c.isCorrect)

  await prisma.attemptAnswer.create({
    data: {
      attemptId: a1.id,
      questionId: flaggedBlank.id,
      selectedChoiceIdsJson: '[]',
      isFlagged: true,
    },
  })
  if (correctChoice) {
    await prisma.attemptAnswer.create({
      data: {
        attemptId: a1.id,
        questionId: answeredRight.id,
        selectedChoiceIdsJson: JSON.stringify([correctChoice.id]),
      },
    })
  }

  await scoreAttempt(a1.id)
  const r1 = await getAttemptResult(a1.id)
  if (!r1) throw new Error('getAttemptResult trả null cho lượt vừa chấm')

  expect(
    'Câu gắn cờ bỏ trống KHÔNG bị đếm là Sai',
    !r1.wrongQuestions.some((q) => q.id === flaggedBlank.id),
    r1.wrongQuestions.some((q) => q.id === flaggedBlank.id)
      ? 'vẫn nằm trong danh sách câu sai'
      : 'không nằm trong danh sách câu sai',
  )

  const sum = r1.counts.correct + r1.counts.wrong + r1.counts.unanswered
  const gradableTotal = r1.counts.total - r1.counts.ungraded
  expect(
    'correct + wrong + unanswered === số câu chấm được',
    sum === gradableTotal,
    `${r1.counts.correct} + ${r1.counts.wrong} + ${r1.counts.unanswered} = ${sum}, mong đợi ${gradableTotal}`,
  )

  // ---- 2. Câu tự luận bỏ trống vẫn được đếm (B3) ----------------------------
  // Không có dòng answer nào, nên bản cũ đếm `ungraded` theo dòng sẽ bỏ sót và
  // thổi phồng mẫu số "N/M câu đúng".
  expect(
    'ESSAY bỏ trống vẫn vào nhóm "chưa chấm"',
    r1.counts.ungraded === essays.length,
    `ungraded = ${r1.counts.ungraded}, số câu tự luận trong đề = ${essays.length}`,
  )

  // ---- 3. Câu bị hạn chế không lọt vào mẫu số -------------------------------
  const publicCount = await prisma.question.count({
    where: { section: { paperId: paper.id }, ...publicQuestionFilter() },
  })
  expect(
    'Mẫu số chỉ tính câu được phép publish',
    r1.counts.total === publicCount,
    `counts.total = ${r1.counts.total}, số câu qua bộ lọc = ${publicCount}`,
  )

  // ---- 4. Xếp hạng phân biệt "một mình" với "thấp nhất" (B4) ----------------
  const alone = await computePercentile(paper.id, r1.attempt.scaledScore)
  expect(
    'cohortSize đếm được số người đã nộp',
    alone.cohortSize >= 1,
    `cohortSize = ${alone.cohortSize}`,
  )

  // Thêm một lượt điểm 0 để có phổ 2 người: người thấp hơn phải nhận đúng 0%
  // NHƯNG cohortSize > 1 — hai chuyện khác nhau mà bản cũ gộp thành một số 0.
  const a2 = await makeAttempt(paper.id, { durationSec: paper.totalDuration })
  await scoreAttempt(a2.id) // không trả lời gì -> điểm thấp nhất
  const low = await getAttemptResult(a2.id)
  if (!low) throw new Error('getAttemptResult trả null cho lượt điểm 0')

  expect(
    'Người điểm thấp nhất KHÔNG bị coi là người đầu tiên',
    low.attempt.cohortSize >= 2,
    `percentile = ${low.attempt.percentile}, cohortSize = ${low.attempt.cohortSize} (bản cũ chỉ thấy số 0)`,
  )

  // ---- 5. timeSpent có trần (B5) -------------------------------------------
  // Lượt thi mở từ 24 giờ trước rồi mới được chấm: không được ghi 24 giờ vào
  // "Bạn làm trong X" và vào thời gian trung bình của mọi người khác.
  const a3 = await makeAttempt(paper.id, {
    startedMinutesAgo: 24 * 60,
    durationSec: paper.totalDuration,
  })
  await scoreAttempt(a3.id)
  const stale = await prisma.attempt.findUnique({ where: { id: a3.id } })
  const cap = paper.totalDuration + GRACE_SEC
  expect(
    'timeSpent bị chặn trần theo thời lượng đề',
    (stale?.timeSpent ?? 0) <= cap,
    `timeSpent = ${stale?.timeSpent}s, trần = ${cap}s (bản cũ ghi ~86400s)`,
  )

  // ---- 6. Server cưỡng chế hết giờ ------------------------------------------
  // Quá hạn quá xa để giải thích bằng độ trễ mạng: batch phải bị BỎ, lượt thi
  // phải bị đóng và đánh dấu là server tự nộp.
  const a4 = await prisma.attempt.create({
    data: {
      paperId: paper.id,
      guestId: CHECK_TAG,
      mode: 'EXAM',
      status: 'IN_PROGRESS',
      startedAt: new Date(Date.now() - 7200_000),
      expiresAt: new Date(Date.now() - (GRACE_SEC + 600) * 1000),
    },
  })
  await scoreAttempt(a4.id, { autoSubmitted: true })
  const closed = await prisma.attempt.findUnique({ where: { id: a4.id } })
  expect(
    'Lượt thi quá hạn bị đóng và đánh dấu tự nộp',
    closed?.status === 'SUBMITTED' && closed?.autoSubmitted === true,
    `status = ${closed?.status}, autoSubmitted = ${closed?.autoSubmitted}`,
  )

  // ---- 7. Chấm lại là idempotent -------------------------------------------
  const again = await scoreAttempt(a1.id)
  expect(
    'Chấm lại một lượt đã nộp không chấm lần hai',
    again.alreadySubmitted === true,
    `alreadySubmitted = ${again.alreadySubmitted}`,
  )
}

async function cleanup() {
  const mine = await prisma.attempt.findMany({
    where: { guestId: CHECK_TAG },
    select: { id: true, paperId: true },
  })
  const ids = mine.map((a) => a.id)
  if (ids.length === 0) return

  await prisma.attemptAnswer.deleteMany({ where: { attemptId: { in: ids } } })
  await prisma.annotation.deleteMany({ where: { attemptId: { in: ids } } })
  await prisma.attempt.deleteMany({ where: { id: { in: ids } } })

  // attemptCount/avgScore trên TestPaper là dữ liệu phi chuẩn hoá đã bị các lượt
  // giả làm lệch — tính lại để script không để lại dấu vết nào.
  for (const paperId of [...new Set(mine.map((a) => a.paperId))]) {
    const agg = await prisma.attempt.aggregate({
      where: { paperId, status: 'SUBMITTED' },
      _count: { _all: true },
      _avg: { scaledScore: true },
    })
    await prisma.testPaper.update({
      where: { id: paperId },
      data: { attemptCount: agg._count._all, avgScore: agg._avg.scaledScore },
    })
  }
  console.log(`\n(đã dọn ${ids.length} lượt thi tạm)`)
}

main()
  .catch((err) => {
    console.error('\n✗ Script lỗi:', err)
    expect('Script chạy tới cuối', false, String(err))
  })
  .finally(async () => {
    await cleanup()

    console.log('\n' + '─'.repeat(64))
    for (const c of checks) {
      console.log(`${c.ok ? '✓' : '✗'} ${c.name}\n    ${c.detail}`)
    }
    const failed = checks.filter((c) => !c.ok)
    console.log('─'.repeat(64))
    console.log(failed.length === 0 ? '✓ Tất cả bất biến đều giữ' : `✗ ${failed.length} khẳng định sai`)

    await prisma.$disconnect()
    process.exit(failed.length === 0 ? 0 : 1)
  })
