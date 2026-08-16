import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Mã hoá đối xứng AES-256-GCM cho những giá trị BẮT BUỘC giữ bí mật khi nằm
 * trong database — hiện là access/refresh token của Google Calendar
 * (xem `model CalendarConnection` trong prisma/schema.prisma).
 *
 * Vì sao là GCM chứ không phải CBC: GCM có sẵn thẻ xác thực, nên nếu ai đó sửa
 * bản mã trong DB thì lúc giải mã sẽ NÉM LỖI thay vì trả về rác. Với token đi
 * gọi API của người khác thì "phát hiện được can thiệp" quan trọng ngang với
 * "không đọc được".
 *
 * Khoá lấy từ ENCRYPTION_KEY — 64 ký tự hex = 32 byte, sinh bởi
 * `npm run gen:secrets`. Đổi khoá làm mọi bản ghi cũ không giải mã được nữa;
 * khi đó người dùng phải kết nối lại, và `getConnection` xử lý đúng trường hợp
 * đó thay vì làm sập trang.
 */

const ALGO = 'aes-256-gcm'
const IV_LEN = 12 // 96 bit — độ dài IV chuẩn cho GCM
const KEY_LEN = 32

let cachedKey: Buffer | null = null

function key(): Buffer {
  if (cachedKey) return cachedKey

  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error('Thiếu ENCRYPTION_KEY. Chạy `npm run gen:secrets`.')
  }

  const buf = Buffer.from(raw.trim(), 'hex')
  if (buf.length !== KEY_LEN) {
    throw new Error(
      `ENCRYPTION_KEY phải là ${KEY_LEN} byte dạng hex (${KEY_LEN * 2} ký tự), đang là ${buf.length} byte.`,
    )
  }

  cachedKey = buf
  return buf
}

/** Trả về chuỗi "iv.tag.ciphertext", cả ba phần đều base64url. */
export function encrypt(plain: string): string {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

/**
 * Giải mã chuỗi do `encrypt` tạo ra.
 * NÉM LỖI nếu định dạng sai, khoá sai, hoặc bản mã đã bị sửa — người gọi phải
 * bắt và xử lý như "mất kết nối", đừng nuốt lỗi ở đây.
 */
export function decrypt(payload: string): string {
  const parts = payload.split('.')
  if (parts.length !== 3) throw new Error('Bản mã sai định dạng')

  const [ivB64, tagB64, dataB64] = parts
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
