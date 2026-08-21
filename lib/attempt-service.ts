import 'server-only'
import DOMPurify from 'isomorphic-dompurify'
import { prisma } from './db'
import { assertPublishable, publicQuestionFilter } from './content-filter'
import { parseStringArray } from './json-fields'
import type { AnnotationType, AttemptMode, AttemptStatus, AudioPlayMode, HighlightColor, QuestionType, Skill } from './enums'

/**
 * Nạp nội dung đề cho phòng thi.
 *
 * BẢO MẬT (SPEC mục 5 + 6): hàm này KHÔNG BAO GIỜ trả `isCorrect` hay
 * `explanation` khi bài còn IN_PROGRESS. Việc lọc làm ở đây — tầng server —
 * chứ không dựa vào client ẩn đi.
 */

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div']

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['class'],
  })
}

export type RoomChoice = { id: string; label: string; content: string }

export type RoomQuestion = {
  id: string
  number: number
  type: QuestionType
  content: string
  imageUrl: string | null
  audioUrl: string | null
  points: number
  passageId: string | null
  sectionId: string
  choices: RoomChoice[]
  /** Chỉ có sau khi nộp bài */
  correctChoiceIds?: string[]
  correctText?: string[]
  explanation?: string | null
  tags?: string[]
}

export type RoomPassage = {
  id: string
  title: string | null
  content: string
  sortOrder: number
}

export type RoomSection = {
  id: string
  skill: Skill
  title: string
  instructions: string
  duration: number
  sortOrder: number
  audioUrl: string | null
  audioPlayMode: AudioPlayMode
  /**
   * Đã bắt đầu phát audio của phần này chưa — do SERVER trả lời.
   *
   * Cam kết "nghe một lần" chỉ có giá trị khi nó sống sót qua F5. Trước đây trạng
   * thái này là `useState` trong AudioPlayer, nên tải lại trang là hiện lại nút
   * "Bắt đầu nghe" và nghe lại được bao nhiêu lần tuỳ thích.
   */
  audioStarted: boolean
  /** Chỉ lộ sau khi nộp bài (SPEC F2.3) */
  transcript: string | null
  passages: RoomPassage[]
  questions: RoomQuestion[]
}

export type RoomAnswer = {
  questionId: string
  selectedChoiceIds: string[]
  textAnswer: string | null
  isFlagged: boolean
  timeSpent: number
  changedCount: number
  isCorrect?: boolean | null
  pointsEarned?: number
}

export type RoomAnnotation = {
  id: string
  targetType: string
  targetId: string
  type: AnnotationType
  startOffset: number | null
  endOffset: number | null
  selectedText: string | null
  color: HighlightColor | null
  noteContent: string | null
}

export type ExamRoomData = {
  attempt: {
    id: string
    mode: AttemptMode
    status: AttemptStatus
    startedAt: string
    expiresAt: string
    currentSectionId: string | null
    /** Giây còn lại, tính từ server tại thời điểm request */
    remainingSeconds: number
    timeSpent: number
    /**
     * Lần cuối server nhận được batch đồng bộ, ISO string.
     *
     * Dùng để quyết định bản nháp trong sessionStorage có MỚI HƠN dữ liệu server
     * hay không. Thiếu mốc này thì bước merge lúc hydrate chạy theo kiểu "ai ghi
     * sau thắng", và tab mở lâu ngày sẽ đè bản nháp cũ lên đáp án mới của tab kia.
     */
    lastSyncAt: string
  }
  paper: {
    id: string
    title: string
    totalDuration: number
    examName: string
    examSlug: string
    paperSlug: string
    levelName: string | null
  }
  sections: RoomSection[]
  answers: RoomAnswer[]
  annotations: RoomAnnotation[]
}

/**
 * @param revealAnswers chỉ true khi bài đã SUBMITTED (trang xem lại)
 */
export async function loadExamRoom(
  attemptId: string,
  revealAnswers = false,
): Promise<ExamRoomData | null> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      annotations: true,
      paper: {
        include: {
          exam: true,
          level: true,
          provenance: { select: { canPublish: true } },
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              passages: { orderBy: { sortOrder: 'asc' } },
              // Câu hỏi mang provenance RIÊNG: một đề hợp lệ vẫn có thể chứa câu
              // bị hạn chế. Bộ lọc này phải khớp với lib/scoring và lib/results —
              // xem ghi chú ở scoreAttempt.
              questions: {
                where: publicQuestionFilter(),
                orderBy: { number: 'asc' },
                include: { choices: { orderBy: { sortOrder: 'asc' } } },
              },
            },
          },
        },
      },
    },
  })

  if (!attempt) return null
  // Đề bị thu hồi quyền publish sau khi attempt được tạo -> chặn luôn
  if (!assertPublishable(attempt.paper)) return null

  const submitted = attempt.status === 'SUBMITTED'
  // Không tin tham số truyền vào: chỉ lộ đáp án khi bài THỰC SỰ đã nộp
  const reveal = revealAnswers && submitted

  const now = Date.now()
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.expiresAt.getTime() - now) / 1000),
  )

  const audioPlayed = new Set(parseStringArray(attempt.audioPlayedSectionIdsJson))

  const sections: RoomSection[] = attempt.paper.sections.map((s) => ({
    id: s.id,
    skill: s.skill as Skill,
    title: s.title,
    instructions: s.instructions,
    duration: s.duration,
    sortOrder: s.sortOrder,
    audioUrl: s.audioUrl,
    // Ở chế độ PRACTICE cho phép tua kể cả khi đề đặt ONCE_NO_SEEK (SPEC F1/F2.3)
    audioPlayMode: (attempt.mode === 'PRACTICE' ? 'FREE' : s.audioPlayMode) as AudioPlayMode,
    audioStarted: audioPlayed.has(s.id),
    transcript: reveal ? s.transcript : null,
    passages: s.passages.map((p) => ({
      id: p.id,
      title: p.title,
      content: sanitize(p.content),
      sortOrder: p.sortOrder,
    })),
    questions: s.questions.map((q) => ({
      id: q.id,
      number: q.number,
      type: q.type as QuestionType,
      content: q.content,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      points: q.points,
      passageId: q.passageId,
      sectionId: s.id,
      choices: q.choices.map((c) => ({ id: c.id, label: c.label, content: c.content })),
      ...(reveal
        ? {
            correctChoiceIds: q.choices.filter((c) => c.isCorrect).map((c) => c.id),
            correctText: parseStringArray(q.correctTextJson),
            explanation: q.explanation,
            tags: parseStringArray(q.tagsJson),
          }
        : {}),
    })),
  }))

  return {
    attempt: {
      id: attempt.id,
      mode: attempt.mode as AttemptMode,
      status: attempt.status as AttemptStatus,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      currentSectionId: attempt.currentSectionId,
      remainingSeconds,
      timeSpent: attempt.timeSpent,
      lastSyncAt: attempt.lastSyncAt.toISOString(),
    },
    paper: {
      id: attempt.paper.id,
      title: attempt.paper.title,
      totalDuration: attempt.paper.totalDuration,
      examName: attempt.paper.exam.name,
      examSlug: attempt.paper.exam.slug,
      paperSlug: attempt.paper.slug,
      levelName: attempt.paper.level?.name ?? null,
    },
    sections,
    answers: attempt.answers.map((a) => ({
      questionId: a.questionId,
      selectedChoiceIds: parseStringArray(a.selectedChoiceIdsJson),
      textAnswer: a.textAnswer,
      isFlagged: a.isFlagged,
      timeSpent: a.timeSpent,
      changedCount: a.changedCount,
      ...(reveal ? { isCorrect: a.isCorrect, pointsEarned: a.pointsEarned } : {}),
    })),
    annotations: attempt.annotations.map((a) => ({
      id: a.id,
      targetType: a.targetType,
      targetId: a.targetId,
      type: a.type as AnnotationType,
      startOffset: a.startOffset,
      endOffset: a.endOffset,
      selectedText: a.selectedText,
      color: a.color as HighlightColor | null,
      noteContent: a.noteContent,
    })),
  }
}

/** Đồng hồ sống ở lib/exam-clock.ts — thuần, không kéo theo server-only/DOMPurify. */
export { GRACE_SEC, overdueSeconds } from './exam-clock'
