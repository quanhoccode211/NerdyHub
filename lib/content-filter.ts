import type { Prisma } from './generated/prisma/client'

/**
 * QUY TẮC CỨNG (SPEC mục 3.1)
 * Mọi truy vấn trả nội dung ra public PHẢI đi qua đây.
 * Không tin vào việc lập trình viên nhớ — dùng các helper này, đừng viết where thủ công.
 *
 * Hai tầng khoá độc lập:
 *   1. TestPaper.status = PUBLISHED       (quy trình biên tập)
 *   2. Provenance.canPublish = true       (pháp lý / bản quyền)
 * Thiếu một trong hai => không được lộ ra ngoài.
 */

/** Điều kiện lọc cho TestPaper hiển thị công khai. */
export function publicPaperFilter(): Prisma.TestPaperWhereInput {
  return {
    status: 'PUBLISHED',
    provenance: { canPublish: true },
  }
}

/**
 * Điều kiện lọc cho Question hiển thị công khai.
 * Câu hỏi mang provenance riêng: một đề hợp lệ vẫn có thể chứa câu bị hạn chế.
 */
export function publicQuestionFilter(): Prisma.QuestionWhereInput {
  return {
    provenance: { canPublish: true },
  }
}

/** Kết hợp filter công khai với điều kiện bổ sung mà không cho phép ghi đè khoá. */
export function withPublicPaperFilter(
  where: Prisma.TestPaperWhereInput = {},
): Prisma.TestPaperWhereInput {
  // publicPaperFilter đặt sau cùng trong AND để điều kiện gọi đến không thể nới lỏng nó
  return { AND: [where, publicPaperFilter()] }
}

/**
 * Chốt chặn cuối trước khi trả nội dung. Dùng khi đã có object trong tay
 * (ví dụ sau findUnique) thay vì trong mệnh đề where.
 */
export function assertPublishable(paper: {
  status: string
  provenance: { canPublish: boolean }
}): boolean {
  return paper.status === 'PUBLISHED' && paper.provenance.canPublish === true
}
