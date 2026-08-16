import 'server-only'

/**
 * Gửi email.
 *
 * SPEC chỉ định Resend. Khi chưa có `RESEND_API_KEY`, email được in ra console
 * thay vì ném lỗi — luồng đăng ký và nhắc lịch vẫn chạy đủ để phát triển và test,
 * và log in rõ cả link để bấm thẳng.
 *
 * KHÔNG im lặng nuốt lỗi khi ĐÃ cấu hình: lúc đó gửi hỏng là sự cố thật.
 */

export type EmailMessage = {
  to: string
  subject: string
  /** Nội dung text thuần — đủ cho các email giao dịch của v1 */
  text: string
}

export type SendResult = { ok: boolean; transport: 'resend' | 'console'; error?: string }

const FROM = process.env.EMAIL_FROM ?? 'Nerdy Hub <onboarding@resend.dev>'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!isEmailConfigured()) {
    console.log(
      [
        '',
        '┌─ EMAIL (chưa cấu hình RESEND_API_KEY — chỉ in ra console) ─',
        `│ Tới    : ${message.to}`,
        `│ Tiêu đề: ${message.subject}`,
        '├────────────────────────────────────────────────────────────',
        message.text
          .split('\n')
          .map((l) => `│ ${l}`)
          .join('\n'),
        '└────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    )
    return { ok: true, transport: 'console' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Resend trả ${res.status}: ${body}`)
      return { ok: false, transport: 'resend', error: `HTTP ${res.status}` }
    }
    return { ok: true, transport: 'resend' }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'unknown'
    console.error(`[email] Gửi thất bại: ${error}`)
    return { ok: false, transport: 'resend', error }
  }
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

// ---- Các mẫu email ----------------------------------------------------------

export function guardianConsentEmail(params: {
  guardianEmail: string
  childName: string
  token: string
}): EmailMessage {
  const link = `${siteUrl()}/xac-nhan-giam-ho?token=${params.token}`
  return {
    to: params.guardianEmail,
    subject: 'Xác nhận cho phép con bạn sử dụng Nerdy Hub',
    text: `Xin chào,

${params.childName} (dưới 16 tuổi) vừa đăng ký tài khoản trên Nerdy Hub — nền tảng
luyện đề và thi thử trực tuyến.

Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, chúng tôi cần sự đồng ý của
cha mẹ hoặc người giám hộ trước khi xử lý dữ liệu của trẻ em.

Khi CHƯA có xác nhận của bạn, tài khoản vẫn làm bài được nhưng:
  • không xuất hiện trên bảng xếp hạng công khai
  • không nhận email tiếp thị

Xác nhận tại đây:
${link}

Liên kết có hiệu lực trong 7 ngày. Nếu bạn không mong đợi email này, hãy bỏ qua —
không có gì xảy ra cả.

Nerdy Hub`,
  }
}
