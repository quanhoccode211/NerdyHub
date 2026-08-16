/**
 * Sinh các khoá bí mật cần thiết và ghi vào .env nếu chưa có.
 *
 *   AUTH_SECRET     ký/giải mã JWT session của Auth.js
 *   ENCRYPTION_KEY  32 byte cho AES-256-GCM, mã hoá token Google Calendar (F5)
 *
 * Chạy: npm run gen:secrets
 * Không ghi đè giá trị đã có — chạy lại nhiều lần vô hại.
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ENV_PATH = path.join(process.cwd(), '.env')

const SECRETS = {
  AUTH_SECRET: () => randomBytes(32).toString('base64'),
  ENCRYPTION_KEY: () => randomBytes(32).toString('hex'), // 32 byte = 64 ký tự hex
}

let content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : ''
if (content.length > 0 && !content.endsWith('\n')) content += '\n'

const added = []
const kept = []

for (const [key, generate] of Object.entries(SECRETS)) {
  // Có dòng KEY=<giá trị không rỗng> thì giữ nguyên
  const existing = new RegExp(`^${key}=(.*)$`, 'm').exec(content)
  if (existing && existing[1].trim() !== '') {
    kept.push(key)
    continue
  }
  if (existing) {
    content = content.replace(existing[0], `${key}=${generate()}`)
  } else {
    content += `${key}=${generate()}\n`
  }
  added.push(key)
}

writeFileSync(ENV_PATH, content, 'utf8')

for (const k of added) console.log(`✓ Đã sinh ${k}`)
for (const k of kept) console.log(`· Giữ nguyên ${k} (đã có sẵn)`)

if (!/^GOOGLE_CLIENT_ID=.+$/m.test(content)) {
  console.log('\n· Chưa có GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.')
  console.log('  Đăng nhập email + mật khẩu vẫn chạy bình thường.')
  console.log('  Muốn bật đăng nhập Google và Calendar: xem docs/google-oauth-setup.md')
}
