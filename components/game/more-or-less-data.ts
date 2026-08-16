/**
 * Dữ liệu More or Less — toàn bộ về Việt Nam và thế giới.
 *
 * Luật chuỗi (chain): một lượt = 5 câu LIÊN TIẾP cùng một chủ đề.
 * Câu 1 so item mở màn với item ẩn; trả lời xong, GIÁ TRỊ VỪA MỞ trở thành
 * mốc so sánh của câu kế tiếp. Sai không dừng game — chỉ mất điểm câu đó.
 *
 * NGUYÊN TẮC LOGIC (đã dọn lại theo yêu cầu):
 *   1. Mỗi pool chỉ chứa item CÙNG LOẠI, CÙNG CẤP — quốc gia so với quốc gia,
 *      tỉnh so với tỉnh, núi với núi, tòa nhà với tòa nhà. Không trộn
 *      "diện tích Việt Nam" với "diện tích hồ Tây": khác bậc quá lớn thì câu
 *      hỏi tự trả lời, không còn là câu đố.
 *   2. Mỗi pool ≥ 6 item với GIÁ TRỊ KHÁC NHAU từng đôi một (6 item = 5 lần so).
 *   3. Đơn vị phải đồng nhất trong pool — không trộn GDP tổng với GDP/người,
 *      °C với mm mưa.
 * Đã bỏ: pool Khoảng cách/độ dài (tuyến đường khó minh họa, lẫn loại).
 */

export type Category = {
  name: string
  icon: string
}

export type Item = { text: string; value: number }

export type Pool = {
  category: Category
  label: string // ngữ cảnh câu hỏi, hiện trong pill cạnh icon
  unit: string  // rỗng khi label đã nói rõ đơn vị (năm…) — hiện số trơn
  items: Item[]
}

/* ─── Dân số — quốc gia ─── */

const POP_COUNTRY: Pool = {
  category: { name: 'Dân số quốc gia', icon: '👥' },
  label: 'Dân số',
  unit: 'người',
  items: [
    { text: 'Nga', value: 144_000_000 },
    { text: 'Mexico', value: 129_000_000 },
    { text: 'Nhật Bản', value: 124_000_000 },
    { text: 'Philippines', value: 117_000_000 },
    { text: 'Việt Nam', value: 100_000_000 },
    { text: 'Đức', value: 84_500_000 },
    { text: 'Thái Lan', value: 71_800_000 },
    { text: 'Anh', value: 68_400_000 },
    { text: 'Pháp', value: 68_200_000 },
    { text: 'Ý', value: 58_900_000 },
    { text: 'Hàn Quốc', value: 51_700_000 },
    { text: 'Tây Ban Nha', value: 48_600_000 },
    { text: 'Malaysia', value: 34_300_000 },
    { text: 'Campuchia', value: 16_900_000 },
  ],
}

/* ─── Dân số — tỉnh/thành Việt Nam ─── */

const POP_PROVINCE: Pool = {
  category: { name: 'Dân số tỉnh VN', icon: '🏘️' },
  label: 'Dân số',
  unit: 'người',
  items: [
    { text: 'TP. Hồ Chí Minh', value: 9_700_000 },
    { text: 'Hà Nội', value: 8_400_000 },
    { text: 'Thanh Hóa', value: 3_700_000 },
    { text: 'Đồng Nai', value: 3_200_000 },
    { text: 'Nghệ An', value: 3_100_000 },
    { text: 'Bình Dương', value: 2_800_000 },
    { text: 'Hải Phòng', value: 2_090_000 },
    { text: 'Hải Dương', value: 1_800_000 },
    { text: 'Bắc Ninh', value: 1_500_000 },
    { text: 'Quảng Ninh', value: 1_350_000 },
    { text: 'Cần Thơ', value: 1_260_000 },
    { text: 'Đà Nẵng', value: 1_140_000 },
    { text: 'Tỉnh Lào Cai', value: 780_000 },
    { text: 'Bắc Kạn', value: 530_000 },
  ],
}

/* ─── Diện tích — quốc gia ─── */

const AREA_COUNTRY: Pool = {
  category: { name: 'Diện tích quốc gia', icon: '🗺️' },
  label: 'Diện tích',
  unit: 'km²',
  items: [
    { text: 'Indonesia', value: 1_904_569 },
    { text: 'Myanmar', value: 676_578 },
    { text: 'Thái Lan', value: 513_120 },
    { text: 'Nhật Bản', value: 377_975 },
    { text: 'Việt Nam', value: 331_212 },
    { text: 'Malaysia', value: 330_803 },
    { text: 'Philippines', value: 300_000 },
    { text: 'Lào', value: 236_800 },
    { text: 'Campuchia', value: 181_035 },
    { text: 'Hàn Quốc', value: 100_410 },
    { text: 'Hà Lan', value: 41_850 },
    { text: 'Đài Loan', value: 36_197 },
  ],
}

/* ─── Diện tích — tỉnh Việt Nam ─── */

const AREA_PROVINCE: Pool = {
  category: { name: 'Diện tích tỉnh VN', icon: '🏞️' },
  label: 'Diện tích',
  unit: 'km²',
  items: [
    { text: 'Nghệ An', value: 16_490 },
    { text: 'Gia Lai', value: 15_494 },
    { text: 'Sơn La', value: 14_110 },
    { text: 'Đắk Lắk', value: 13_075 },
    { text: 'Thanh Hóa', value: 11_133 },
    { text: 'Quảng Nam', value: 10_577 },
    { text: 'Điện Biên', value: 9_541 },
    { text: 'Tỉnh Lào Cai', value: 6_383 },
    { text: 'Bà Rịa – Vũng Tàu', value: 1_989 },
    { text: 'Đà Nẵng', value: 1_284 },
  ],
}

/* ─── GDP — quốc gia (tỷ USD, quy mô nominal ~2024) ─── */

const GDP: Pool = {
  category: { name: 'GDP', icon: '💰' },
  label: 'GDP',
  unit: 'tỷ USD',
  items: [
    { text: 'Hoa Kỳ', value: 27_700 },
    { text: 'Trung Quốc', value: 18_600 },
    { text: 'Đức', value: 4_590 },
    { text: 'Nhật Bản', value: 4_110 },
    { text: 'Ấn Độ', value: 3_940 },
    { text: 'Anh', value: 3_590 },
    { text: 'Pháp', value: 3_130 },
    { text: 'Ý', value: 2_330 },
    { text: 'Brazil', value: 2_190 },
    { text: 'Canada', value: 2_160 },
    { text: 'Hàn Quốc', value: 1_870 },
    { text: 'Indonesia', value: 1_420 },
    { text: 'Thái Lan', value: 530 },
    { text: 'Singapore', value: 515 },
    { text: 'Việt Nam', value: 435 },
  ],
}

/* ─── Đỉnh núi (thế giới + Việt Nam) ─── */

const MOUNTAIN: Pool = {
  category: { name: 'Đỉnh núi', icon: '🏔️' },
  label: 'Độ cao đỉnh núi',
  unit: 'm',
  items: [
    { text: 'Everest', value: 8_849 },
    { text: 'K2', value: 8_611 },
    { text: 'Kilimanjaro', value: 5_895 },
    { text: 'Mont Blanc', value: 4_808 },
    { text: 'Matterhorn', value: 4_478 },
    { text: 'Núi Phú Sĩ', value: 3_776 },
    { text: 'Fansipan', value: 3_147 },
    { text: 'Bạch Mộc Lương Tử', value: 3_096 },
    { text: 'Pu Si Lũng', value: 3_076 },
    { text: 'Putaleng', value: 3_049 },
  ],
}

/* ─── Tòa nhà & tháp cao ─── */

const TOWER: Pool = {
  category: { name: 'Tòa nhà & tháp', icon: '🏙️' },
  label: 'Chiều cao tòa nhà',
  unit: 'm',
  items: [
    { text: 'Burj Khalifa (Dubai)', value: 828 },
    { text: 'Merdeka 118 (Malaysia)', value: 679 },
    { text: 'Tháp Thượng Hải', value: 632 },
    { text: 'Lotte World Tower (Seoul)', value: 555 },
    { text: 'One World Trade Center (NYC)', value: 541 },
    { text: 'Taipei 101', value: 508 },
    { text: 'Landmark 81 (TP.HCM)', value: 461 },
    { text: 'Tháp đôi Petronas', value: 452 },
    { text: 'Empire State Building', value: 443 },
    { text: 'Keangnam Landmark 72 (Hà Nội)', value: 336 },
    { text: 'Lotte Center Hà Nội', value: 272 },
    { text: 'Tháp Bitexco (TP.HCM)', value: 262 },
  ],
}

/* ─── Nhiệt độ thành phố ─── */

const TEMP: Pool = {
  category: { name: 'Nhiệt độ', icon: '🌡️' },
  label: 'Nhiệt độ',
  unit: '°C',
  items: [
    { text: 'Huế (tháng 6)', value: 40 },
    { text: 'Nha Trang (tháng 6)', value: 35 },
    { text: 'Hà Nội (tháng 6)', value: 33 },
    { text: 'TP.HCM (tháng 1)', value: 28 },
    { text: 'Đà Lạt (tháng 6)', value: 24 },
    { text: 'Hà Nội (tháng 1)', value: 17 },
    { text: 'Đà Lạt (mùa đông)', value: 10 },
    { text: 'Sapa (mùa đông)', value: -2 },
  ],
}

/* ─── Giá món ăn Việt ─── */

const FOOD: Pool = {
  category: { name: 'Giá cả', icon: '🍜' },
  label: 'Giá',
  unit: 'VNĐ',
  items: [
    { text: 'Cơm tấm sườn', value: 60_000 },
    { text: 'Phở bò TP.HCM', value: 55_000 },
    { text: 'Bún chả Hà Nội', value: 45_000 },
    { text: 'Cà phê sữa đá', value: 35_000 },
    { text: 'Gạo tấm', value: 25_000 },
    { text: 'Bánh mì', value: 20_000 },
    { text: 'Trà đá vỉa hè', value: 5_000 },
  ],
}

/* ─── Năm lịch sử ─── */

const YEAR: Pool = {
  category: { name: 'Lịch sử', icon: '📜' },
  label: 'Năm',
  unit: '', // năm hiện số trơn, không ngăn cách nghìn — "1954"
  items: [
    { text: 'ĐH Quốc gia Hà Nội (thành lập)', value: 1993 },
    { text: 'Thống nhất đất nước', value: 1975 },
    { text: 'ĐH Bách Khoa Hà Nội (thành lập)', value: 1956 },
    { text: 'Chiến thắng Điện Biên Phủ', value: 1954 },
    { text: 'Nhà thờ Đức Bà (xây)', value: 1877 },
    { text: 'Chợ Bến Thành (xây)', value: 1874 },
    { text: 'Chùa Phật Tích', value: 1057 },
    { text: 'Chùa Một Cột', value: 1049 },
  ],
}

/* ─── Nghệ sĩ Việt ─── */

const ARTIST: Pool = {
  category: { name: 'Nghệ sĩ Việt', icon: '🎤' },
  label: 'Người nghe Spotify',
  unit: 'người/tháng',
  // Số liệu ƯỚC LƯỢNG gần đúng (thay đổi theo tháng), chọn gần nhau để căng.
  items: [
    { text: 'Sơn Tùng M-TP', value: 11_200_000 },
    { text: 'Đen Vâu', value: 7_900_000 },
    { text: 'HIEUTHUHAI', value: 6_800_000 },
    { text: 'jack (J97)', value: 5_400_000 },
    { text: 'Hoàng Thùy Linh', value: 4_500_000 },
    { text: 'Tăng Duy Tân', value: 3_800_000 },
    { text: 'Hòa Minzy', value: 3_500_000 },
    { text: 'Đức Phúc', value: 3_200_000 },
    { text: 'MONO', value: 2_850_000 },
    { text: 'AMEE', value: 2_600_000 },
    { text: 'ERIK', value: 2_400_000 },
    { text: 'Bích Phương', value: 2_150_000 },
    { text: 'Vũ.', value: 1_900_000 },
    { text: 'SOOBIN', value: 1_750_000 },
    { text: 'Thùy Chi', value: 1_700_000 },
    { text: 'Rhyder', value: 1_450_000 },
    { text: 'Wren Evans', value: 1_250_000 },
    { text: 'Trịnh Thăng Bình', value: 1_150_000 },
    { text: 'Mr. Siro', value: 1_200_000 },
    { text: 'Noo Phước Thịnh', value: 1_100_000 },
    { text: 'B Ray', value: 950_000 },
    { text: 'Chillies', value: 820_000 },
  ],
}

export const POOLS: Pool[] = [
  POP_COUNTRY,
  POP_PROVINCE,
  AREA_COUNTRY,
  AREA_PROVINCE,
  GDP,
  MOUNTAIN,
  TOWER,
  TEMP,
  FOOD,
  YEAR,
  ARTIST,
]

/**
 * Định dạng số ĐẦY ĐỦ cho thẻ giá trị — không rút gọn thành "tr"/"ngàn".
 *
 * plain = true (unit rỗng — năm, thứ hạng, số đếm không đơn vị):
 *   hiện nguyên con số, KHÔNG ngăn cách nghìn — "1954", "1010".
 * plain = false: đầy đủ chữ số với ngăn cách nghìn kiểu vi-VN —
 *   "9.700.000", "331.212", "5,3".
 *
 * `decimals` cố định số lẻ khi hiển thị (dùng bởi animation đếm số để
 * các khung giữa không nhảy loạn số lẻ); bỏ qua thì suy ra từ chính `n`.
 */
export function fmtFull(n: number, plain = false, decimals?: number): string {
  const d = decimals ?? (String(n).split('.')[1] ?? '').length
  if (plain) return String(Math.round(n))
  return n.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })
}
