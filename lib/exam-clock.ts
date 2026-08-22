/**
 * Đồng hồ phòng thi — các hằng và phép tính THUẦN, không chạm database.
 *
 * Tách riêng khỏi `lib/attempt-service.ts` có lý do cụ thể: file đó khai
 * `import 'server-only'` và kéo theo DOMPurify. Bộ chấm điểm và route sync chỉ cần
 * hai thứ dưới đây, nên nếu chúng nằm chung thì mọi script chạy bằng tsx (và mọi
 * bài test sau này) đều phải lôi cả bộ sanitize HTML vào chỉ để hỏi "hết giờ chưa".
 */

/**
 * Dung sai của SERVER quanh hạn chót, tính bằng giây.
 *
 * KHÔNG phải thời gian tặng thêm cho thí sinh: `expiresAt` là hạn chót đúng nghĩa
 * và đồng hồ hiển thị đếm tới đúng mốc đó. Con số này chỉ để hấp thụ độ trễ mạng —
 * một batch rời khỏi máy client lúc còn 3 giây nhưng tới server sau hạn chót vẫn là
 * thao tác làm TRƯỚC giờ, vứt nó đi là phạt nhầm người vì đường truyền của họ.
 *
 * Trước đây khoảng đệm này bị cộng thẳng vào `expiresAt`, nên đề 60 phút mở ra là
 * đồng hồ chạy từ 60:30 — thí sinh nhìn thấy được.
 */
export const GRACE_SEC = 30

/**
 * Quá hạn bao nhiêu giây. `<= 0` nghĩa là còn giờ.
 *
 * Một hàm duy nhất cho mọi nơi cần trả lời "hết giờ chưa": route sync, trang phòng
 * thi, bộ chấm. Ba nơi tự tính lấy là ba cơ hội để chúng bất đồng.
 * PRACTICE đếm giờ LÊN nên không bao giờ quá hạn.
 */
export function overdueSeconds(attempt: { mode: string; expiresAt: Date }): number {
  if (attempt.mode === 'PRACTICE') return 0
  return Math.floor((Date.now() - attempt.expiresAt.getTime()) / 1000)
}
