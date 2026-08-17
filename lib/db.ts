import path from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

/*
  Nạp `.env` khi CHƯA ai nạp hộ.

  Next tự nạp `.env`, nhưng các script chạy bằng tsx (`db:peek`, `check:*`,
  `purge:users`…) thì không — chúng import thẳng file này. Bản SQLite cũ giấu
  được chuyện đó nhờ fallback `'file:./dev.db'`; với Postgres thì không có giá
  trị mặc định nào hợp lý, và triệu chứng là ECONNREFUSED tới localhost — đọc
  ra như "Postgres chết" trong khi thật ra chỉ là thiếu biến môi trường.

  Bọc trong `if` để ở Vercel (biến có sẵn, không có file .env) đây là no-op.
*/
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.join(process.cwd(), '.env'))
  } catch {
    // Không có .env — dùng biến môi trường sẵn có (CI, Vercel)
  }
}

// Prisma 7 nhận connection qua driver adapter thay vì datasource url.
//
// POSTGRES, không còn SQLite: Vercel chạy serverless nên không có đĩa để giữ
// một file .db. `DATABASE_URL` trỏ tới Postgres có host thật (Neon, Supabase,
// Vercel Postgres…) — xem .env.example.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/*
  Singleton dùng lại qua các lần gọi.

  Trên Vercel điều này QUAN TRỌNG HƠN ở máy dev: mỗi serverless function được
  giữ ấm giữa các request, nên tạo client mới mỗi lần là mở thêm một pool kết
  nối mới tới Postgres. Vài chục lần như vậy là chạm trần connection của gói
  miễn phí, và triệu chứng là lỗi "too many connections" xuất hiện ngẫu nhiên
  lúc có nhiều người vào — chứ không phải lỗi tái hiện được.

  Vì vậy biến toàn cục được dùng ở MỌI môi trường, không chỉ dev như bản trước.
*/
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

globalForPrisma.prisma = prisma
