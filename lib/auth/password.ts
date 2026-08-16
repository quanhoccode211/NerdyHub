import bcrypt from 'bcryptjs'

/** SPEC mục 6: bcrypt cost 12. */
const COST = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/**
 * So sánh giả khi email không tồn tại.
 *
 * Nếu thoát sớm lúc không tìm thấy user, thời gian phản hồi sẽ khác hẳn so với
 * khi email có thật — đủ để dò xem email nào đã đăng ký. Băm một chuỗi rác để
 * chi phí hai nhánh tương đương.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.7XoW7hqhZ5nEUuU0MdRZoNqXKxDvSGm'

export async function fakeCompare(plain: string): Promise<void> {
  await bcrypt.compare(plain, DUMMY_HASH)
}
