/**
 * Xác minh tuổi theo NĐ 13/2023 Điều 20.
 *
 * Ngưỡng là **dưới 16 tuổi** — trẻ em theo định nghĩa của Nghị định, phải có
 * sự đồng ý của cha mẹ hoặc người giám hộ.
 */

export const MINOR_AGE_THRESHOLD = 16

/** Tuổi tròn tính tới hôm nay. */
export function ageFrom(birthDate: Date, now = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDiff = now.getMonth() - birthDate.getMonth()
  // Chưa tới sinh nhật năm nay thì trừ đi một tuổi
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function isMinor(birthDate: Date, now = new Date()): boolean {
  return ageFrom(birthDate, now) < MINOR_AGE_THRESHOLD
}

/** Ngày sinh hợp lệ: không ở tương lai, không quá 120 tuổi. */
export function isPlausibleBirthDate(birthDate: Date, now = new Date()): boolean {
  if (Number.isNaN(birthDate.getTime())) return false
  if (birthDate.getTime() > now.getTime()) return false
  return ageFrom(birthDate, now) <= 120
}

/**
 * Tài khoản có được xuất hiện công khai (bảng xếp hạng) hay không.
 * SPEC F6: user < 16 chưa có guardianConsent thì KHÔNG.
 */
export function canAppearPublicly(user: {
  isMinor: boolean
  guardianConsent: boolean
}): boolean {
  return !user.isMinor || user.guardianConsent
}

/** Tài khoản có được nhận email tiếp thị hay không — cùng ràng buộc. */
export function canReceiveMarketing(user: {
  isMinor: boolean
  guardianConsent: boolean
}): boolean {
  return canAppearPublicly(user)
}
