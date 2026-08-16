import path from 'node:path'
import process from 'node:process'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 CLI không tự nạp .env. Node 20.6+ có sẵn loader, khỏi cần dotenv.
try {
  process.loadEnvFile(path.join(process.cwd(), '.env'))
} catch {
  // .env không tồn tại — dùng biến môi trường sẵn có (CI, Docker)
}

// Prisma 7 đưa connection URL ra khỏi schema.prisma.
// URL ở đây chỉ dùng cho Migrate/CLI; runtime dùng driver adapter trong lib/db.ts.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
