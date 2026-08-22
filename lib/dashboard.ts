import 'server-only'
import { prisma } from './db'
import { publicPaperFilter } from './content-filter'
import { getFavoriteExamIds, getFavoritePaperIds } from './favorites'
import { getStrategy } from './scoring'
import type { Skill } from './enums'

/** Dữ liệu cho Dashboard mới. */

export type ExamProgress = {
  examId: string
  slug: string
  name: string
  fullName: string
  language: string
  totalPapers: number
  donePapers: number
  percent: number
  avgScorePercent: number | null
  /** Lượt đang làm dở để bấm "Làm tiếp" */
  inProgressAttemptId: string | null
  lastPaperTitle: string | null
}

export type ExamProgressResult = {
  exams: ExamProgress[]
  /**
   * `favorites` — người dùng đã đánh sao, đây là tiến độ thật trên danh sách
   * họ tự chọn. `recommended` — chưa đánh sao đề nào, đây là đề cử để bắt đầu.
   *
   * Widget đọc cờ này để đổi tiêu đề và chữ trong thẻ. Không suy ra từ
   * `donePapers === 0`: một người đã đánh sao nhưng chưa làm đề nào cũng cho
   * số 0 y hệt, mà họ thì đã chọn xong rồi, đề cử lại là nói sai.
   */
  mode: 'favorites' | 'recommended'
}

/** Bao nhiêu kỳ thi được đề cử cho người chưa đánh sao đề nào. */
const RECOMMEND_COUNT = 3

/**
 * Tiến độ luyện đề theo từng kỳ thi — khối "Ongoing Class" của ảnh tham chiếu.
 * Chỉ đếm đề công khai để mẫu số khớp với thứ người dùng thực sự làm được.
 *
 * MẪU SỐ LÀ ĐỀ ĐÃ ĐÁNH SAO, không phải toàn bộ đề của kỳ thi. Thanh tiến độ vì
 * vậy đọc là "tiến độ trên danh sách bạn tự chọn" — một kỳ thi có 40 đề mà bạn
 * quan tâm 3 đề thì làm xong 3 đề đó là 100%, không phải 7%. Con số cũ chạy
 * theo việc kho đề có thêm bao nhiêu đề mới, tức tiến độ tụt xuống vì người
 * khác nạp thêm đề — một thước đo không nói gì về người đang nhìn nó.
 *
 * Chưa đánh sao đề nào thì trả về `mode: 'recommended'` kèm vài kỳ thi phổ
 * biến nhất. Danh sách rỗng là màn hình chết: không có gì để nhìn và cũng
 * không gợi ra được bước tiếp theo.
 */
export async function getExamProgress(
  userId: string | null,
  guestId: string | null,
): Promise<ExamProgressResult> {
  const owner = userId ? { userId } : guestId ? { guestId } : null

  const exams = await prisma.exam.findMany({
    where: { isActive: true, papers: { some: publicPaperFilter() } },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { papers: { where: publicPaperFilter() } } },
    },
  })

  const [favoriteIds, favoriteExamIds] = owner
    ? await Promise.all([
        getFavoritePaperIds(userId, guestId),
        getFavoriteExamIds(userId, guestId),
      ])
    : [[] as string[], [] as string[]]
  const favoriteExamSet = new Set(favoriteExamIds)

  /*
    ĐỀ CỬ: xếp theo tổng lượt làm của cả kỳ thi, lấy ba kỳ đầu.

    `attemptCount` đã là cột denormalized sẵn trên TestPaper (dùng cho sắp xếp
    ở Kho đề) nên không phải đếm lại bằng join — xem ghi chú ở schema.
  */
  if (favoriteIds.length === 0 && favoriteExamIds.length === 0) {
    const counts = await prisma.testPaper.groupBy({
      by: ['examId'],
      where: publicPaperFilter(),
      _sum: { attemptCount: true },
    })
    const popularity = new Map(counts.map((c) => [c.examId, c._sum.attemptCount ?? 0]))

    return {
      mode: 'recommended',
      exams: [...exams]
        .sort(
          (a, b) =>
            (popularity.get(b.id) ?? 0) - (popularity.get(a.id) ?? 0) ||
            a.sortOrder - b.sortOrder,
        )
        .slice(0, RECOMMEND_COUNT)
        .map((e) => ({
          examId: e.id,
          slug: e.slug,
          name: e.name,
          fullName: e.fullName,
          language: e.language,
          totalPapers: e._count.papers,
          donePapers: 0,
          percent: 0,
          avgScorePercent: null,
          inProgressAttemptId: null,
          lastPaperTitle: null,
        })),
    }
  }

  const attempts = await prisma.attempt.findMany({
    where: { ...owner, paper: publicPaperFilter() },
    orderBy: { startedAt: 'desc' },
    include: { paper: { select: { id: true, examId: true, title: true } } },
  })

  /* Đếm đề đã đánh sao theo từng kỳ thi — đây là MẪU SỐ mới của thanh tiến độ. */
  const favoriteSet = new Set(favoriteIds)
  const favoritePapers = await prisma.testPaper.findMany({
    where: { id: { in: favoriteIds } },
    select: { id: true, examId: true },
  })
  const favoriteTotals = new Map<string, number>()
  for (const p of favoritePapers) {
    favoriteTotals.set(p.examId, (favoriteTotals.get(p.examId) ?? 0) + 1)
  }

  return {
    mode: 'favorites',
    /*
      Kỳ thi KHÔNG có đề nào được đánh sao thì biến mất khỏi widget — đó chính
      là yêu cầu "tiến độ chỉ hiện những đề quan tâm". Lọc trước khi map để
      những kỳ đó không kịp sinh ra một thẻ 0/0.
    */
    exams: exams
      .filter((exam) => favoriteExamSet.has(exam.id) || (favoriteTotals.get(exam.id) ?? 0) > 0)
      .map((exam) => {
        /*
          Chỉ tính trên ĐỀ ĐÃ ĐÁNH SAO, cả tử lẫn mẫu. Lọc thêm ở đây chứ không
          nới `where` của truy vấn attempts bên trên: những lượt làm trên đề
          không đánh sao vẫn cần cho `lastPaperTitle` và cho nút "Làm tiếp" —
          bỏ chúng khỏi truy vấn là người dùng đang làm dở một đề mà thẻ lại
          nói chưa bắt đầu gì.
        */
        /*
          HAI CẤP SAO, và cấp ĐỀ thắng khi có mặt.

          Đánh sao cả kỳ thi = "theo dõi kỳ này", mẫu số là toàn bộ đề công
          khai. Đánh sao vài đề bên trong = "tôi chỉ định làm mấy đề này", một
          câu nói cụ thể hơn — nên mẫu số thu về đúng mấy đề đó. Lấy tổng của
          cả kỳ khi người ta đã chọn tay từng đề là dựng lại đúng cái thước đo
          vô nghĩa mà thay đổi này sinh ra để bỏ đi.
        */
        const pickedPapers = favoriteTotals.get(exam.id) ?? 0
        const scopeToFavorites = pickedPapers > 0

        const mine = attempts.filter((a) => a.paper.examId === exam.id)
        const inFavorites = scopeToFavorites
          ? mine.filter((a) => favoriteSet.has(a.paper.id))
          : mine
        const submitted = inFavorites.filter((a) => a.status === 'SUBMITTED')
        // Đếm theo ĐỀ riêng biệt, làm lại một đề không tính thành hai
        const donePapers = new Set(submitted.map((a) => a.paper.id)).size
        const inProgress = mine.find((a) => a.status === 'IN_PROGRESS')

        const maxScale = getStrategy(exam.slug).maxScale
        const scored = submitted.filter((a) => a.scaledScore !== null)
        const avgScorePercent =
          scored.length > 0
            ? scored.reduce((s, a) => s + ((a.scaledScore ?? 0) / maxScale) * 100, 0) /
              scored.length
            : null

        const totalPapers = scopeToFavorites ? pickedPapers : exam._count.papers

        return {
          examId: exam.id,
          slug: exam.slug,
          name: exam.name,
          fullName: exam.fullName,
          language: exam.language,
          totalPapers,
          donePapers,
          percent: totalPapers > 0 ? Math.round((donePapers / totalPapers) * 100) : 0,
          avgScorePercent,
          inProgressAttemptId: inProgress?.id ?? null,
          lastPaperTitle: mine[0]?.paper.title ?? null,
        }
      }),
  }
}

export type DayHours = {
  date: string // YYYY-MM-DD
  label: string // "23 Th3"
  seconds: number
  isToday: boolean
}

export type SkillTime = { skill: Skill; seconds: number }

/**
 * Giờ luyện tập N ngày gần nhất — khối "Learning Hours".
 * Cộng `timeSpent` của các lượt đã nộp, gom theo ngày địa phương.
 */
export async function getLearningHours(
  userId: string | null,
  guestId: string | null,
  days = 6,
): Promise<{ series: DayHours[]; bySkill: SkillTime[]; goalSeconds: number }> {
  const owner = userId ? { userId } : guestId ? { guestId } : null

  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))

  const attempts = owner
    ? await prisma.attempt.findMany({
        where: { ...owner, status: 'SUBMITTED', submittedAt: { gte: since } },
        select: {
          timeSpent: true,
          submittedAt: true,
          paper: { select: { sections: { select: { skill: true, duration: true } } } },
        },
      })
    : []

  const byDay = new Map<string, number>()
  const bySkill = new Map<Skill, number>()

  for (const a of attempts) {
    if (!a.submittedAt) continue
    const key = toLocalDateKey(a.submittedAt)
    byDay.set(key, (byDay.get(key) ?? 0) + a.timeSpent)

    // Chia thời gian cho các kỹ năng theo tỉ lệ thời lượng section của đề
    const sections = a.paper.sections
    const totalDuration = sections.reduce((s, x) => s + x.duration, 0)
    for (const s of sections) {
      const share =
        totalDuration > 0 ? a.timeSpent * (s.duration / totalDuration) : a.timeSpent / Math.max(1, sections.length)
      bySkill.set(s.skill as Skill, (bySkill.get(s.skill as Skill) ?? 0) + share)
    }
  }

  const todayKey = toLocalDateKey(new Date())
  const series: DayHours[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = toLocalDateKey(d)
    series.push({
      date: key,
      label: `${d.getDate()} Th${d.getMonth() + 1}`,
      seconds: byDay.get(key) ?? 0,
      isToday: key === todayKey,
    })
  }

  return {
    series,
    bySkill: [...bySkill.entries()]
      .map(([skill, seconds]) => ({ skill, seconds: Math.round(seconds) }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 3),
    goalSeconds: 60 * 60, // mục tiêu 1 giờ/ngày — đường ngắt quãng trên biểu đồ
  }
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type ScheduleItem = {
  id: string
  title: string
  examName: string
  dayIndex: number // 0..N-1 trong dải ngày hiển thị
  startHour: number
  endHour: number
  percent: number
  tone: 'mint' | 'peri' | 'sky'
  href: string
}

/**
 * Lịch ôn dạng timeline — khối "Class Schedule".
 *
 * F5 (StudyPlan + Reminder) chưa build nên chưa có buổi ôn do người dùng đặt.
 * Tạm dựng từ dữ liệu CÓ THẬT: các lượt đã làm trong tuần, đặt đúng ngày và
 * giờ thực tế. Khi F5 xong thì thay nguồn, không phải sửa giao diện.
 */
export async function getSchedule(
  userId: string | null,
  guestId: string | null,
  days = 6,
): Promise<{ items: ScheduleItem[]; dayLabels: string[]; todayIndex: number }> {
  const owner = userId ? { userId } : guestId ? { guestId } : null

  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))

  const attempts = owner
    ? await prisma.attempt.findMany({
        where: { ...owner, submittedAt: { gte: since } },
        orderBy: { submittedAt: 'asc' },
        include: { paper: { select: { title: true, exam: { select: { name: true, slug: true } } } } },
        take: 12,
      })
    : []

  const dayKeys: string[] = []
  const dayLabels: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    dayKeys.push(toLocalDateKey(d))
    dayLabels.push(`${d.getDate()}/${d.getMonth() + 1}`)
  }

  const tones: ScheduleItem['tone'][] = ['mint', 'peri', 'sky']

  const items: ScheduleItem[] = attempts.flatMap((a, i) => {
    if (!a.submittedAt) return []
    const key = toLocalDateKey(a.submittedAt)
    const dayIndex = dayKeys.indexOf(key)
    if (dayIndex === -1) return []

    const startHour = a.submittedAt.getHours() + a.submittedAt.getMinutes() / 60
    const durationHours = Math.max(0.5, a.timeSpent / 3600)

    return [
      {
        id: a.id,
        title: a.paper.title,
        examName: a.paper.exam.name,
        dayIndex,
        startHour: Math.max(0, startHour - durationHours),
        endHour: startHour,
        percent: a.status === 'SUBMITTED' ? 100 : 0,
        tone: tones[i % tones.length],
        href: a.status === 'SUBMITTED' ? `/ket-qua/${a.id}` : `/thi/${a.id}`,
      },
    ]
  })

  return { items, dayLabels, todayIndex: days - 1 }
}
