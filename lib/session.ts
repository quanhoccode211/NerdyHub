import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'

/**
 * Danh tính khách vãng lai.
 * SPEC F6: cho phép làm bài không cần đăng nhập, attempt gắn theo cookie session.
 * Auth.js sẽ được gắn ở phiên sau (F6 đầy đủ); khi đó userId ưu tiên hơn guestId.
 */

export const GUEST_COOKIE = 'guest_id'
const ONE_YEAR = 60 * 60 * 24 * 365

/** Đọc guestId hiện có, không tạo mới. Dùng trong Server Component (không ghi được cookie). */
export async function readGuestId(): Promise<string | null> {
  const store = await cookies()
  return store.get(GUEST_COOKIE)?.value ?? null
}

/** Đọc hoặc tạo guestId. CHỈ gọi được trong Route Handler / Server Action. */
export async function ensureGuestId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(GUEST_COOKIE)?.value
  if (existing) return existing

  const id = randomUUID()
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
    secure: process.env.NODE_ENV === 'production',
  })
  return id
}

/**
 * Danh tính hiện tại, gộp cả hai chế độ.
 *
 * Sau khi có F6, một request có thể mang cả cookie khách lẫn session đăng nhập.
 * `userId` được ưu tiên; `guestId` vẫn trả về để đọc được các lượt làm chưa kịp
 * gộp (jwt callback gộp lúc đăng nhập, nhưng không nên phụ thuộc vào đúng một
 * đường duy nhất khi dữ liệu bài làm là thứ không được phép mất).
 */
export async function getIdentity(): Promise<{
  userId: string | null
  guestId: string | null
}> {
  const { auth } = await import('@/auth')
  const [session, guestId] = await Promise.all([auth(), readGuestId()])
  return { userId: session?.user?.id ?? null, guestId }
}

/** Xoá danh tính khách. Gọi khi đăng xuất — xem app/actions/sign-out.ts. */
export async function clearGuestId(): Promise<void> {
  const store = await cookies()
  store.delete(GUEST_COOKIE)
}

/**
 * Người dùng hiện tại có quyền trên attempt này không.
 *
 * Lượt thi ĐÃ GẮN TÀI KHOẢN thì chỉ tài khoản đó mở được, tuyệt đối không rơi
 * xuống nhánh khách. Bản cũ đòi cả hai phía không null ở nhánh đầu, nên khi một
 * người đăng xuất, `ctx.userId` thành null và nhánh khách bắt lấy — mà cookie
 * `guest_id` sống một năm và trước đây không bị xoá khi đăng xuất. Kết quả: trên
 * máy dùng chung, người tiếp theo đọc được bài của người trước.
 */
export function ownsAttempt(
  attempt: { userId: string | null; guestId: string | null },
  ctx: { userId?: string | null; guestId?: string | null },
): boolean {
  if (attempt.userId) return ctx.userId === attempt.userId
  if (attempt.guestId && ctx.guestId) return attempt.guestId === ctx.guestId
  return false
}
