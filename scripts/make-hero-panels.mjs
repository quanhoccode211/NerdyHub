/**
 * Cắt ảnh hero thành 3 tấm rời.
 *
 * Nguồn `assets/hero-doodles.png` là MỘT dải ngang chứa cả ba nhân vật, mỗi
 * nhân vật đứng trên một khối pastel bo góc. Trang chủ cần ba tấm rời để (a)
 * mỗi tấm pop-in lệch nhau, (b) mỗi tấm là một ảnh nhỏ thay vì một file 2.5MB.
 *
 * Ranh giới KHÔNG hard-code: file quét từng cột pixel, cột nào toàn màu nền
 * (xám rất nhạt, gần như trắng) thì coi là rãnh giữa hai khối. Nhờ vậy xuất lại
 * ảnh gốc với kích thước khác vẫn cắt đúng.
 *
 *   npm run make:hero
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = path.join(process.cwd(), 'assets', 'hero-doodles.png')
const OUT_DIR = path.join(process.cwd(), 'public', 'hero')

/** Cột được coi là "nền" khi >= tỉ lệ này số pixel gần với màu nền. */
const BG_RATIO = 0.995
/** Khoảng lệch tối đa so với màu nền để vẫn tính là nền. */
const BG_TOLERANCE = 6
/** Bề rộng tối thiểu của một khối, để bỏ qua các rãnh nhỏ trong nét vẽ. */
const MIN_BAND = 200
/** Chừa thêm một chút quanh khối cho nét vẽ tràn ra ngoài. */
const BLEED = 34
/**
 * Ngưỡng LOANG: chỉ đi tiếp qua pixel gần màu nền đến mức này.
 *
 * Phải để rất chặt. Các khối pastel chỉ cách màu nền 13–20 đơn vị (nền
 * #F1E9EA, pastel #F1E4FE / #FEE5EE / #E1F6EC), nên ngưỡng rộng sẽ loang
 * thẳng vào trong khối và ăn mất một nửa độ đục của nó.
 */
const FLOOD_TOLERANCE = 6
/** Ngưỡng VIỀN: pixel rìa trong khoảng này được cho alpha một phần, nhưng KHÔNG loang tiếp. */
const EDGE_TOLERANCE = 11
/**
 * Xuất theo CHIỀU CAO, không theo chiều rộng.
 *
 * Ba khối rộng khác nhau. Nếu ép cùng bề rộng thì tỉ lệ thu phóng khác nhau,
 * đáy các khối pastel sẽ lệch nhau khi xếp cạnh nhau. Cùng chiều cao thì mọi
 * thứ giữ nguyên tương quan như ảnh gốc. Hiển thị ~380px, xuất 2x cho retina.
 */
const OUT_HEIGHT = 760

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true })
const { width, height, channels } = info

// Màu nền lấy ở góc trên trái — vùng chắc chắn trống
const bg = [data[0], data[1], data[2]]

function isBackground(x) {
  let hits = 0
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels
    if (
      Math.abs(data[i] - bg[0]) <= BG_TOLERANCE &&
      Math.abs(data[i + 1] - bg[1]) <= BG_TOLERANCE &&
      Math.abs(data[i + 2] - bg[2]) <= BG_TOLERANCE
    ) {
      hits++
    }
  }
  return hits / height >= BG_RATIO
}

// Gom các cột có nội dung thành từng dải liên tục
const bands = []
let start = null
for (let x = 0; x < width; x++) {
  const bgCol = isBackground(x)
  if (!bgCol && start === null) start = x
  if (bgCol && start !== null) {
    if (x - start >= MIN_BAND) bands.push([start, x])
    start = null
  }
}
if (start !== null && width - start >= MIN_BAND) bands.push([start, width])

if (bands.length !== 3) {
  console.error(
    `Cắt hỏng: tìm thấy ${bands.length} khối thay vì 3.\n` +
      `Các khối: ${JSON.stringify(bands)}\n` +
      `Nếu ảnh nguồn đổi, chỉnh BG_TOLERANCE / MIN_BAND ở đầu file.`,
  )
  process.exit(1)
}

/**
 * Xoá nền thành trong suốt bằng loang từ VIỀN ảnh vào.
 *
 * Không thể chỉ so màu từng pixel: bong bóng thoại ở tấm 2 và mặt sau máy tính
 * bảng ở tấm 3 cũng gần trắng, so màu thuần sẽ đục thủng luôn hình vẽ. Loang từ
 * viền thì chỉ vùng nền THỰC SỰ nối ra ngoài mới bị xoá, phần trắng nằm trong
 * nét vẽ được giữ nguyên vì đã bị nét đen bao kín.
 */
function cutoutBackground(buf, w, h) {
  const px = w * h
  const alpha = new Uint8Array(px).fill(255)
  const seen = new Uint8Array(px)
  const stack = []

  const dist = (idx) => {
    const i = idx * 4
    return Math.max(
      Math.abs(buf[i] - bg[0]),
      Math.abs(buf[i + 1] - bg[1]),
      Math.abs(buf[i + 2] - bg[2]),
    )
  }

  /**
   * Hai ngưỡng tách bạch: pixel chỉ ĐƯỢC LOANG TIẾP khi rất giống nền, còn
   * pixel rìa thì chỉ được giảm alpha rồi dừng. Gộp hai ngưỡng làm một là lý do
   * lần đầu cả khối pastel bị ăn mất độ đục.
   */
  const push = (idx) => {
    if (seen[idx]) return
    seen[idx] = 1

    const d = dist(idx)
    if (d <= FLOOD_TOLERANCE) {
      alpha[idx] = 0
      stack.push(idx)
    } else if (d <= EDGE_TOLERANCE) {
      // Rìa khử răng cưa: mờ dần, nhưng không lan tiếp vào trong hình
      alpha[idx] = Math.round(((d - FLOOD_TOLERANCE) / (EDGE_TOLERANCE - FLOOD_TOLERANCE)) * 255)
    }
  }

  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }

  while (stack.length > 0) {
    const idx = stack.pop()
    const x = idx % w
    const y = (idx / w) | 0
    if (x > 0) push(idx - 1)
    if (x < w - 1) push(idx + 1)
    if (y > 0) push(idx - w)
    if (y < h - 1) push(idx + w)
  }

  for (let i = 0; i < px; i++) buf[i * 4 + 3] = alpha[i]
  return buf
}

await mkdir(OUT_DIR, { recursive: true })

const manifest = []
for (const [i, [left, right]] of bands.entries()) {
  const x = Math.max(0, left - BLEED)
  const w = Math.min(width - x, right - left + BLEED * 2)

  const cropped = await sharp(SRC)
    .extract({ left: x, top: 0, width: w, height })
    .resize({ height: OUT_HEIGHT })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const cut = cutoutBackground(cropped.data, cropped.info.width, cropped.info.height)

  const out = path.join(OUT_DIR, `panel-${i + 1}.webp`)
  const result = await sharp(cut, {
    raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 },
  })
    // KHÔNG trim: ba tấm phải giữ nguyên cùng chiều cao thì đáy các khối pastel
    // mới thẳng hàng khi xếp cạnh nhau. Phần thừa đã trong suốt nên vô hại.
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(out)

  manifest.push({ src: `/hero/panel-${i + 1}.webp`, width: result.width, height: result.height })
  console.log(`panel-${i + 1}.webp  ${result.width}x${result.height}  ${(result.size / 1024).toFixed(0)}KB`)
}

// Kích thước ghi ra file để trang chủ khai báo width/height chính xác,
// tránh nhảy layout khi ảnh tải xong.
await writeFile(path.join(OUT_DIR, 'panels.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`\nĐã ghi ${manifest.length} tấm + panels.json vào public/hero/`)
