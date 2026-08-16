/**
 * Rate limit — SPEC mục 5: 10 req/phút cho submit, 60 req/phút cho sync.
 *
 * SPEC chỉ định Redis. Máy dev không có Redis nên đây là bản in-memory
 * sliding window, cùng chữ ký hàm để đổi sang Redis (INCR + EXPIRE) mà
 * không phải sửa nơi gọi.
 *
 * GIỚI HẠN ĐÃ BIẾT: bộ nhớ tiến trình — nhiều instance sẽ đếm riêng.
 * Phải thay bằng Redis trước khi chạy nhiều instance.
 */

type Bucket = { hits: number[]; }
const buckets = new Map<string, Bucket>()

// Dọn định kỳ để Map không phình vô hạn trong tiến trình dài hạn
let lastSweep = Date.now()
function sweep(windowMs: number) {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    b.hits = b.hits.filter((t) => now - t < windowMs)
    if (b.hits.length === 0) buckets.delete(key)
  }
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number }

export function rateLimit(key: string, limit: number, windowMs = 60_000): RateLimitResult {
  sweep(windowMs)
  const now = Date.now()
  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    buckets.set(key, bucket)
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSec: 0 }
}

export const LIMITS = {
  createAttempt: 20,
  sync: 60,
  submit: 10,
} as const
