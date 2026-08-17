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

/**
 * Dải màu dọc bên trái mỗi thẻ kỳ thi — xem app/(marketing)/de-thi/page.tsx.
 *
 * Là MÀU TƯỢNG TRƯNG, KHÔNG phải lá cờ thu nhỏ. Cờ thật có tỉ lệ, ngôi sao,
 * huy hiệu; nhét vào một dải rộng 6px thì thành một vệt bẩn không đọc ra gì,
 * mà lại còn dễ vẽ sai quốc kỳ của người ta. Chỉ lấy hai tới ba màu đặc trưng
 * nhất rồi xếp thành băng cứng.
 *
 * Mã màu lấy đúng bảng màu chính thức của từng quốc kỳ, để dải màu không bị
 * đọc thành "đỏ với vàng chung chung".
 *
 * Bám theo NGÔN NGỮ chứ không theo nước tổ chức, cùng nguyên tắc với
 * `LANGUAGE_FLAGS` — kỳ thi mới thêm vào là tự có dải, không phải khai gì thêm.
 *
 * SỐ MÀU KHÔNG CẦN BẰNG NHAU giữa các ngôn ngữ: `languageStripe()` chia đều
 * dải theo số màu, nên một màu ra dải trơn, hai màu ra hai băng bằng nhau.
 * VI cố ý chỉ còn MỘT màu — đỏ trơn.
 */
export const LANGUAGE_STRIPES: Record<Language, string[]> = {
  EN: ['#C8102E', '#012169'], // Anh — đỏ / xanh navy
  KO: ['#FFFFFF', '#0047A0'], // Hàn — trắng / xanh
  JA: ['#FFFFFF', '#BC002D'], // Nhật — trắng / đỏ
  ZH: ['#EE1C25', '#FFDE00'], // Trung — đỏ / vàng
  DE: ['#000000', '#DD0000', '#FFCE00'], // Đức — đen / đỏ / vàng
  VI: ['#DA251D'], // Việt Nam — ĐỎ trơn, một màu
}

/**
 * Dựng `linear-gradient` với các mốc màu TRÙNG NHAU ở mỗi ranh giới, để ra băng
 * cứng chứ không phải chuyển màu mềm: `#a 0 33.3%, #b 33.3% 66.6%, …`.
 *
 * Gradient mềm sẽ trộn đỏ với vàng thành cam ở giữa — một màu không có trên lá
 * cờ nào trong danh sách.
 */
export function languageStripe(language: Language): string {
  const colors = LANGUAGE_STRIPES[language]
  const step = 100 / colors.length
  const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
  return `linear-gradient(180deg, ${stops.join(', ')})`
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

/**
 * MỖI MỤC ĐÍCH ĐƯỢC HỎI Ở ĐÂU — ba nhóm rời nhau, hợp lại đúng bằng
 * `CONSENT_PURPOSES`.
 *
 * Trang Cài đặt vẫn liệt kê CẢ NĂM và bật/tắt được từng cái. Phân nhóm dưới đây
 * chỉ nói *lần đầu* mỗi mục đích được hỏi ở đâu, không phải nơi duy nhất người
 * dùng kiểm soát nó — quyền rút lại từng mục vẫn nguyên vẹn theo NĐ 13.
 */

/** Hiện thành ô tích riêng trên form đăng ký. */
export const CONSENT_FORM_PURPOSES = ['SERVICE_ESSENTIAL', 'MARKETING_EMAIL'] as const

/**
 * Nằm trong nội dung Điều khoản sử dụng — bấm đồng ý điều khoản là đồng ý luôn.
 *
 * Chỉ gộp được vì Điều khoản là BẮT BUỘC ở cả hai luồng tạo tài khoản (đăng ký
 * bằng mật khẩu và hoàn tất hồ sơ sau khi đăng nhập Google), nên không có đường
 * nào tạo được tài khoản mà chưa đọc tới phần mô tả hai mục này.
 */
export const CONSENT_TERMS_PURPOSES = ['ANALYTICS', 'LEADERBOARD_PUBLIC'] as const

/*
  CALENDAR_ACCESS KHÔNG nằm trong nhóm nào ở trên, và đó là chủ ý.

  Nó được hỏi ĐÚNG LÚC dùng: `/api/calendar/callback` ghi granted=true ngay sau
  khi người dùng bấm qua màn hình cấp quyền của Google, và `disconnectCalendar`
  ghi lại false. Ghi sẵn granted=true lúc đăng ký là lưu một sự đồng ý cho việc
  chưa hề xảy ra — bản ghi consent phải phản ánh đúng thực tế xử lý dữ liệu.
*/

export const REMINDER_TYPES = [
  'STUDY_SESSION',
  'EXAM_COUNTDOWN',
  'STREAK_RISK',
  'WEEKLY_REPORT',
] as const
export type ReminderType = (typeof REMINDER_TYPES)[number]

export const REMINDER_CHANNELS = ['EMAIL', 'CALENDAR', 'IN_APP'] as const
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number]
