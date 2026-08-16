/**
 * Bọc các trường scalar-list mà SQLite không hỗ trợ.
 * Đọc/ghi luôn đi qua đây để chỗ nào cũng xử lý JSON hỏng như nhau
 * thay vì ném lỗi vào mặt người dùng đang thi.
 *
 * Chuyển sang PostgreSQL: xoá file này, dùng String[]/Int[] trực tiếp.
 */

export function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function parseNumberArray(json: string | null | undefined): number[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed)
      ? parsed.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      : []
  } catch {
    return []
  }
}

export function parseRecord(json: string | null | undefined): Record<string, number> {
  if (!json) return {}
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

export function serialize(value: unknown): string {
  return JSON.stringify(value ?? null)
}
