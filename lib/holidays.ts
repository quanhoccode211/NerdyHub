/**
 * NGÀY LỄ VIỆT NAM — tính ra, không kê bảng.
 *
 * Hai trong số các ngày nghỉ quan trọng nhất là ngày ÂM LỊCH: Tết Nguyên đán
 * (mùng 1 tháng Giêng) và Giỗ Tổ Hùng Vương (mùng 10 tháng Ba). Chúng rơi vào
 * ngày dương khác nhau mỗi năm, nên một bảng gõ tay sẽ đúng trong vài năm rồi
 * âm thầm sai — mà sai theo hướng tệ nhất: lịch vẫn hiện ra bình thường, chỉ là
 * đánh dấu nhầm ngày.
 *
 * Nên phần âm lịch được quy đổi bằng thuật toán thiên văn (kiểu Hồ Ngọc Đức):
 * tìm ngày Sóc (trăng mới) và kinh độ Mặt Trời để dựng tháng âm, rồi đổi ngược
 * ra ngày dương. Không có bảng nào để bảo trì.
 *
 * MÚI GIỜ LÀ THAM SỐ CỦA BÀI TOÁN, không phải chi tiết vặt: âm lịch Việt Nam
 * lấy mốc UTC+7. Tính bằng múi giờ khác thì có năm Tết lệch hẳn một ngày, vì
 * thời điểm Sóc rơi sát nửa đêm. Vì vậy TZ đóng cứng là 7 chứ không đọc từ máy
 * người dùng — máy để múi giờ nào thì Tết Việt Nam vẫn là Tết Việt Nam.
 */

const TZ = 7

const INT = Math.floor
const PI = Math.PI

/** Ngày dương -> số ngày Julius. */
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12)
  const y = yy + 4800 - a
  const m = mm + 12 * a - 3
  let jd =
    dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083
  }
  return jd
}

/** Số ngày Julius -> [ngày, tháng, năm] dương. */
function jdToDate(jd: number): [number, number, number] {
  let b: number
  let c: number
  if (jd > 2299160) {
    const a = jd + 32044
    b = INT((4 * a + 3) / 146097)
    c = a - INT((b * 146097) / 4)
  } else {
    b = 0
    c = jd + 32082
  }
  const d = INT((4 * c + 3) / 1461)
  const e = c - INT((1461 * d) / 4)
  const m = INT((5 * e + 2) / 153)
  const day = e - INT((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * INT(m / 10)
  const year = b * 100 + d - 4800 + INT(m / 10)
  return [day, month, year]
}

/** Thời điểm Sóc thứ k tính từ 1/1/1900, trả về số ngày Julius (có phần lẻ). */
function newMoon(k: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = PI / 180
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  jd1 = jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr)
  c1 = c1 - 0.0004 * Math.sin(dr * 3 * Mpr)
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr))
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M))
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr))
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M))
  let deltat: number
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
  }
  return jd1 + c1 - deltat
}

/** Kinh độ Mặt Trời (radian) tại thời điểm jdn. */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525
  const T2 = T * T
  const dr = PI / 180
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = (L0 + DL) * dr
  L = L - PI * 2 * INT(L / (PI * 2))
  return L
}

/** Cung hoàng đạo (0..11) của Mặt Trời vào đầu ngày `dayNumber`. */
function getSunLongitude(dayNumber: number, timeZone: number): number {
  return INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6)
}

/** Ngày (số nguyên, theo múi giờ) chứa thời điểm Sóc thứ k. */
function getNewMoonDay(k: number, timeZone: number): number {
  return INT(newMoon(k) + 0.5 + timeZone / 24)
}

/** Ngày bắt đầu tháng 11 âm của năm dương `yy` — mốc để dựng cả năm âm. */
function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021
  const k = INT(off / 29.530588853)
  let nm = getNewMoonDay(k, timeZone)
  const sunLong = getSunLongitude(nm, timeZone)
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone)
  return nm
}

/** Vị trí tháng nhuận so với tháng 11 âm. */
function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5)
  let last: number
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i++
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

/**
 * Ngày ÂM -> ngày DƯƠNG. Trả `null` nếu tháng nhuận được yêu cầu không tồn tại
 * trong năm đó.
 */
function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeap = false,
  timeZone = TZ,
): Date | null {
  let a11: number
  let b11: number
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone)
    b11 = getLunarMonth11(lunarYear, timeZone)
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone)
    b11 = getLunarMonth11(lunarYear + 1, timeZone)
  }
  let off = lunarMonth - 11
  if (off < 0) off += 12
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone)
    let leapMonth = leapOff - 2
    if (leapMonth < 0) leapMonth += 12
    if (isLeap && lunarMonth !== leapMonth) return null
    if (isLeap || off >= leapOff) off += 1
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  const monthStart = getNewMoonDay(k + off, timeZone)
  const [d, m, y] = jdToDate(monthStart + lunarDay - 1)
  return new Date(y, m - 1, d)
}

function iso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function shiftIso(date: Date, days: number): string {
  return iso(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days))
}

/**
 * Ngày lễ của một NĂM DƯƠNG, trả về `{ 'YYYY-MM-DD': 'tên lễ' }`.
 *
 * Chỉ liệt kê các ngày nghỉ chính thức theo Bộ luật Lao động. KHÔNG có những
 * ngày kỷ niệm không được nghỉ (20/11, 8/3, 27/7…): lịch này để người học biết
 * ngày nào không phải đi học, thêm ngày kỷ niệm vào thì mất luôn ý nghĩa đó.
 *
 * Nghỉ Tết là 5 ngày, trải từ 30 tháng Chạp tới mùng 4 — lấy mốc mùng 1 rồi đếm
 * lùi một ngày và tiến ba ngày. Nghỉ bù khi lễ rơi vào cuối tuần thì Chính phủ
 * công bố theo từng năm, không có quy tắc cố định nên KHÔNG tính ở đây.
 */
export function vietnamHolidays(year: number): Record<string, string> {
  const out: Record<string, string> = {
    [`${year}-01-01`]: 'Tết Dương lịch',
    [`${year}-04-30`]: 'Ngày Giải phóng miền Nam',
    [`${year}-05-01`]: 'Quốc tế Lao động',
    [`${year}-09-02`]: 'Quốc khánh',
  }

  /* Tết Nguyên đán: mùng 1 tháng Giêng âm của chính năm dương đó */
  const tet = lunarToSolar(1, 1, year)
  if (tet) {
    out[shiftIso(tet, -1)] = 'Tất niên (30 Tết)'
    out[iso(tet)] = 'Tết Nguyên đán (mùng 1)'
    out[shiftIso(tet, 1)] = 'Tết Nguyên đán (mùng 2)'
    out[shiftIso(tet, 2)] = 'Tết Nguyên đán (mùng 3)'
    out[shiftIso(tet, 3)] = 'Tết Nguyên đán (mùng 4)'
  }

  /* Giỗ Tổ Hùng Vương: mùng 10 tháng Ba âm */
  const gioTo = lunarToSolar(10, 3, year)
  if (gioTo) out[iso(gioTo)] = 'Giỗ Tổ Hùng Vương'

  return out
}
