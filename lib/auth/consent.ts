import 'server-only'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { CONSENT_PURPOSES, type ConsentPurpose } from '@/lib/enums'

/**
 * Quản lý sự đồng ý theo NĐ 13/2023.
 *
 * Quy tắc: TÁCH BẠCH TỪNG MỤC ĐÍCH. Không có ô tích gộp. `SERVICE_ESSENTIAL`
 * bắt buộc để dùng dịch vụ; mọi mục đích còn lại mặc định TẮT và người dùng
 * phải chủ động bật.
 */

export const REQUIRED_PURPOSES: readonly ConsentPurpose[] = ['SERVICE_ESSENTIAL']

export const CONSENT_META: Record<
  ConsentPurpose,
  { title: string; body: string; required: boolean }
> = {
  SERVICE_ESSENTIAL: {
    title: 'Vận hành dịch vụ',
    body: 'Lưu bài làm, chấm điểm, khôi phục phiên thi. Bắt buộc để dùng được sản phẩm.',
    required: true,
  },
  ANALYTICS: {
    title: 'Phân tích sử dụng',
    body: 'Thống kê ẩn danh giúp cải thiện chất lượng đề và trải nghiệm phòng thi.',
    required: false,
  },
  MARKETING_EMAIL: {
    title: 'Email tiếp thị',
    body: 'Nhận thông báo về đề mới và tính năng mới. Có thể tắt bất cứ lúc nào.',
    required: false,
  },
  LEADERBOARD_PUBLIC: {
    title: 'Hiện tên trên bảng xếp hạng',
    body: 'Cho phép hiển thị tên bạn công khai khi so sánh thành tích với người khác.',
    required: false,
  },
  /*
    Mô tả phải khớp ĐÚNG những gì hệ thống thật sự làm — NĐ 13 đòi sự đồng ý cho
    một mục đích cụ thể. Ở đây là CHỈ ĐỌC mốc bận/rảnh (endpoint freeBusy, scope
    calendar.readonly), không tạo lịch và không đọc nội dung sự kiện.
  */
  CALENDAR_ACCESS: {
    title: 'Đọc lịch Google',
    body: 'Đọc các khoảng thời gian bạn đã bận để gợi ý giờ trống mà ôn bài. Chỉ đọc mốc bận/rảnh, không đọc tiêu đề hay nội dung sự kiện, và không tạo hay sửa gì trong lịch của bạn.',
    required: false,
  },
}

/** Lưu vết ngữ cảnh khi ghi nhận đồng ý — NĐ 13 yêu cầu chứng minh được. */
async function requestContext() {
  try {
    const h = await headers()
    return {
      ipAddress:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null,
      userAgent: h.get('user-agent'),
    }
  } catch {
    return { ipAddress: null, userAgent: null }
  }
}

/** Các mục đích phơi bày dữ liệu ra ngoài — trẻ em cần xác nhận giám hộ trước. */
const GUARDIAN_GATED: readonly ConsentPurpose[] = ['LEADERBOARD_PUBLIC', 'MARKETING_EMAIL']

/**
 * Ghi nhận một tập consent. Mỗi mục đích là một bản ghi riêng.
 * `SERVICE_ESSENTIAL` luôn được ghi granted=true; các mục khác theo đúng lựa chọn.
 *
 * Trẻ em chưa có xác nhận giám hộ: các mục trong GUARDIAN_GATED bị ép về false
 * kể cả khi form gửi lên true. Không lưu một sự đồng ý mà hệ thống sẽ không
 * tôn trọng — như vậy bản ghi consent mới phản ánh đúng thực tế xử lý dữ liệu.
 */
export async function recordConsents(
  userId: string,
  granted: Partial<Record<ConsentPurpose, boolean>>,
) {
  const ctx = await requestContext()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isMinor: true, guardianConsent: true },
  })
  const guardianGateClosed = Boolean(user?.isMinor && !user.guardianConsent)

  await prisma.$transaction(
    CONSENT_PURPOSES.map((purpose) => {
      let value = REQUIRED_PURPOSES.includes(purpose) ? true : (granted[purpose] ?? false)
      if (value && guardianGateClosed && GUARDIAN_GATED.includes(purpose)) {
        value = false
      }
      return prisma.consent.upsert({
        where: { userId_purpose: { userId, purpose } },
        create: {
          userId,
          purpose,
          granted: value,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        update: {
          granted: value,
          grantedAt: new Date(),
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
      })
    }),
  )
}

/** Đổi một mục đích. Không cho tắt mục bắt buộc. */
export async function setConsent(
  userId: string,
  purpose: ConsentPurpose,
  granted: boolean,
): Promise<{ ok: boolean; reason?: string }> {
  if (REQUIRED_PURPOSES.includes(purpose) && !granted) {
    return { ok: false, reason: 'Mục đích này bắt buộc để dịch vụ hoạt động.' }
  }

  // Trẻ em chưa có xác nhận giám hộ: chặn các mục đích có tính phơi bày ra ngoài
  if (granted && GUARDIAN_GATED.includes(purpose)) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isMinor: true, guardianConsent: true },
    })
    if (user?.isMinor && !user.guardianConsent) {
      return {
        ok: false,
        reason: 'Cần xác nhận của người giám hộ trước khi bật mục này.',
      }
    }
  }

  const ctx = await requestContext()
  await prisma.consent.upsert({
    where: { userId_purpose: { userId, purpose } },
    create: {
      userId,
      purpose,
      granted,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
    update: {
      granted,
      grantedAt: new Date(),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  })
  return { ok: true }
}

export async function getConsents(userId: string): Promise<Record<ConsentPurpose, boolean>> {
  const rows = await prisma.consent.findMany({ where: { userId } })
  const map = Object.fromEntries(CONSENT_PURPOSES.map((p) => [p, false])) as Record<
    ConsentPurpose,
    boolean
  >
  for (const r of rows) {
    if ((CONSENT_PURPOSES as readonly string[]).includes(r.purpose)) {
      map[r.purpose as ConsentPurpose] = r.granted
    }
  }
  return map
}

export async function hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
  const row = await prisma.consent.findUnique({
    where: { userId_purpose: { userId, purpose } },
    select: { granted: true },
  })
  return row?.granted ?? false
}
