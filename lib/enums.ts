/**
 * SQLite không hỗ trợ enum trong Prisma. Các enum của SPEC mục 3 sống ở đây
 * dưới dạng union type + mảng hằng, và được Zod validate ở biên API.
 * Khi chuyển sang PostgreSQL, đổi ngược thành `enum` trong schema.prisma
 * và các union này vẫn tương thích về mặt kiểu.
 */

export const LICENSE_TYPES = [
  'PUBLIC_DOMAIN', // VOA, Gutenberg, LibriVox
  'CC0',
  'CC_BY',
  'CC_BY_SA',
  'KOGL_TYPE1', // Hàn Quốc — cho phép thương mại + ghi nguồn
  'GOV_PUBLISHED', // Đề Bộ GD&ĐT công bố công khai
  'LICENSED', // Đã mua/xin phép — phải có licenseDocUrl
  'SELF_AUTHORED',
  'CONTRIBUTOR',
  'RESTRICTED', // CHỈ tham khảo nội bộ — KHÔNG được publish
] as const
export type LicenseType = (typeof LICENSE_TYPES)[number]

/**
 * KHÔNG CÓ 'SPEAKING'. Sản phẩm không định hướng kỹ năng nói: thi nói cần giám
 * khảo hoặc chấm bằng model, không có cách nào làm tử tế trong một phòng thi chạy
 * trên trình duyệt. Giữ lại một dạng câu không bao giờ chấm được chỉ tạo ra những
 * con số "chưa chấm" lửng lơ trên trang kết quả.
 */
export const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'TRUE_FALSE_NOTGIVEN',
  'FILL_BLANK',
  'MATCHING',
  'ORDERING',
  'SHORT_ANSWER',
  'ESSAY', // không tự chấm ở v1
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Các loại câu hỏi engine v1 chưa chấm tự động — SPEC F3 */
export const UNGRADED_TYPES: readonly QuestionType[] = ['ESSAY']

/** Cũng không có 'SPEAKING' — xem ghi chú ở QUESTION_TYPES. */
export const SKILLS = [
  'LISTENING',
  'READING',
  'WRITING',
  'GRAMMAR',
  'VOCABULARY',
  'OTHER',
] as const
export type Skill = (typeof SKILLS)[number]

export const SKILL_LABELS: Record<Skill, string> = {
  LISTENING: 'Nghe',
  READING: 'Đọc',
  WRITING: 'Viết',
  GRAMMAR: 'Ngữ pháp',
  VOCABULARY: 'Từ vựng',
  OTHER: 'Khác',
}

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const CONTENT_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const AUDIO_PLAY_MODES = ['ONCE_NO_SEEK', 'FREE'] as const
export type AudioPlayMode = (typeof AUDIO_PLAY_MODES)[number]

export const LANGUAGES = ['EN', 'KO', 'JA', 'ZH', 'DE', 'VI'] as const
export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  EN: 'Tiếng Anh',
  KO: 'Tiếng Hàn',
  JA: 'Tiếng Nhật',
  ZH: 'Tiếng Trung',
  DE: 'Tiếng Đức',
  VI: 'Tiếng Việt',
}

/**
 * Cờ hiển thị sau tên chứng chỉ.
 *
 * Gắn theo NGÔN NGỮ của kỳ thi chứ không theo nước tổ chức, để khớp với nhãn
 * ngôn ngữ đã hiện sẵn trên cùng tấm thẻ (TOPIK · Tiếng Hàn · 🇰🇷). Nhờ vậy kỳ
 * thi mới thêm vào cũng tự có cờ, không phải khai báo thêm gì.
 *
 * Tiếng Anh lấy cờ Anh, tiếng Đức lấy cờ Đức — chọn nước gốc của ngôn ngữ.
 */
export const LANGUAGE_FLAGS: Record<Language, string> = {
  EN: '🇬🇧',
  KO: '🇰🇷',
  JA: '🇯🇵',
  ZH: '🇨🇳',
  DE: '🇩🇪',
  VI: '🇻🇳',
}

export const EXAM_CATEGORIES = ['LANGUAGE_CERT', 'NATIONAL_EXAM', 'APTITUDE'] as const
export type ExamCategory = (typeof EXAM_CATEGORIES)[number]

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  LANGUAGE_CERT: 'Chứng chỉ ngoại ngữ',
  NATIONAL_EXAM: 'Kỳ thi quốc gia',
  APTITUDE: 'Đánh giá năng lực',
}

export const ATTEMPT_MODES = ['EXAM', 'PRACTICE'] as const
export type AttemptMode = (typeof ATTEMPT_MODES)[number]

/**
 * EXPIRED và ABANDONED hiện KHÔNG được đặt ở đâu cả: bài hết giờ được server chấm
 * và chuyển thẳng sang SUBMITTED, phân biệt bằng cờ `Attempt.autoSubmitted`. Giữ
 * lại cho F8 (Admin CMS) — đừng viết bộ lọc dựa vào chúng, sẽ không bao giờ khớp.
 */
export const ATTEMPT_STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED'] as const
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number]

export const ANNOTATION_TYPES = ['HIGHLIGHT', 'NOTE'] as const
export type AnnotationType = (typeof ANNOTATION_TYPES)[number]

export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'] as const
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

export const ROLES = ['USER', 'TEACHER', 'REVIEWER', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

export const CONSENT_PURPOSES = [
  'SERVICE_ESSENTIAL', // bắt buộc để dùng dịch vụ
  'ANALYTICS',
  'MARKETING_EMAIL',
  'LEADERBOARD_PUBLIC',
  'CALENDAR_ACCESS',
] as const
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number]

export const REMINDER_TYPES = [
  'STUDY_SESSION',
  'EXAM_COUNTDOWN',
  'STREAK_RISK',
  'WEEKLY_REPORT',
] as const
export type ReminderType = (typeof REMINDER_TYPES)[number]

export const REMINDER_CHANNELS = ['EMAIL', 'CALENDAR', 'IN_APP'] as const
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number]
