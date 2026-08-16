import { z } from 'zod'
import { ANNOTATION_TYPES, ATTEMPT_MODES, HIGHLIGHT_COLORS } from './enums'

/** SPEC mục 5: mọi endpoint nhận input đều validate bằng Zod. */

export const createAttemptSchema = z.object({
  paperId: z.string().min(1),
  mode: z.enum(ATTEMPT_MODES),
})

export const answerPatchSchema = z.object({
  questionId: z.string().min(1),
  selectedChoiceIds: z.array(z.string()).max(20).optional(),
  textAnswer: z.string().max(20_000).nullable().optional(),
  isFlagged: z.boolean().optional(),
  timeSpent: z.number().int().min(0).max(86_400).optional(),
  changedCount: z.number().int().min(0).max(10_000).optional(),
})

export const annotationPatchSchema = z.object({
  /** id do client sinh để đồng bộ idempotent */
  id: z.string().min(1).max(64),
  targetType: z.enum(['passage', 'question']),
  targetId: z.string().min(1),
  type: z.enum(ANNOTATION_TYPES),
  startOffset: z.number().int().min(0).nullable().optional(),
  endOffset: z.number().int().min(0).nullable().optional(),
  selectedText: z.string().max(5_000).nullable().optional(),
  color: z.enum(HIGHLIGHT_COLORS).nullable().optional(),
  noteContent: z.string().max(10_000).nullable().optional(),
  /**
   * Trường phân biệt của union bên dưới. Phải khai ở CẢ HAI nhánh thì TypeScript
   * mới thu hẹp kiểu được khi route rẽ nhánh theo `an.deleted`; thiếu nó thì
   * nhánh patch không có thuộc tính này và mọi phép truy cập đều báo lỗi.
   */
  deleted: z.literal(false).optional(),
})

/**
 * Xoá chỉ cần id.
 *
 * Trước đây lệnh xoá phải đi qua `annotationPatchSchema`, nghĩa là client buộc
 * phải BỊA `targetType: 'passage'`, `targetId: 'x'`, `type: 'HIGHLIGHT'` cho một
 * bản ghi sắp biến mất. Chỗ đó chỉ lọt vì route đọc `deleted` rồi thoát sớm
 * trước khi dùng tới mấy trường bịa kia — một hợp đồng nói dối, chờ ngày vỡ.
 */
export const annotationDeleteSchema = z.object({
  id: z.string().min(1).max(64),
  deleted: z.literal(true),
})

/** Nhánh xoá phải đứng TRƯỚC: nhánh patch sẽ nuốt cả hai nếu đảo thứ tự. */
export const annotationSyncSchema = z.union([annotationDeleteSchema, annotationPatchSchema])

export const syncSchema = z.object({
  answers: z.array(answerPatchSchema).max(300).default([]),
  annotations: z.array(annotationSyncSchema).max(300).default([]),
  currentSectionId: z.string().nullable().optional(),
  timeSpent: z.number().int().min(0).max(86_400).optional(),
  /**
   * Các phần đã BẮT ĐẦU phát audio. Server HỢP NHẤT chứ không ghi đè — xem route
   * sync. Client gửi cả tập chứ không gửi delta: tập rất nhỏ, và gửi lại toàn bộ
   * khiến thao tác này idempotent một cách hiển nhiên.
   */
  audioPlayedSectionIds: z.array(z.string().min(1)).max(50).optional(),
})

export type SyncPayload = z.infer<typeof syncSchema>
export type AnswerPatch = z.infer<typeof answerPatchSchema>
export type AnnotationPatch = z.infer<typeof annotationPatchSchema>
export type AnnotationSync = z.infer<typeof annotationSyncSchema>
