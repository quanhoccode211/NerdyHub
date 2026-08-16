'use server'

import { randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { auth, signIn, unstable_update } from '@/auth'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { isMinor, isPlausibleBirthDate } from '@/lib/auth/age'
import { recordConsents } from '@/lib/auth/consent'
import { guardianConsentEmail, sendEmail } from '@/lib/email'
import { TERMS_VERSION } from '@/lib/legal/terms'
import { CONSENT_PURPOSES, type ConsentPurpose } from '@/lib/enums'

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | null

const GUARDIAN_TOKEN_DAYS = 7

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên của bạn').max(100),
    email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(200),
    birthDate: z.string().min(1, 'Bắt buộc nhập ngày sinh'),
    guardianEmail: z.string().trim().toLowerCase().email('Email giám hộ không hợp lệ').optional().or(z.literal('')),
  })
  .transform((v) => ({ ...v, birth: new Date(v.birthDate) }))

/** Sinh token xác nhận giám hộ và gửi email — dùng lại khi người dùng bấm gửi lại. */
async function issueGuardianConsent(userId: string, childName: string, guardianEmail: string) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + GUARDIAN_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  await prisma.guardianConsentToken.create({
    data: { userId, token, guardianEmail, expires },
  })
  await sendEmail(guardianConsentEmail({ guardianEmail, childName, token }))
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    birthDate: formData.get('birthDate'),
    guardianEmail: formData.get('guardianEmail') ?? '',
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      fieldErrors[key] ??= issue.message
    }
    return { fieldErrors }
  }

  const { name, email, password, birth, guardianEmail } = parsed.data

  // Chấp nhận điều khoản là điều kiện tạo tài khoản. Kiểm ở SERVER — nút bị
  // khoá phía client chỉ là trải nghiệm, không phải cơ chế bảo vệ.
  if (formData.get('termsAccepted') !== 'yes') {
    return {
      fieldErrors: {
        termsAccepted: 'Bạn cần đọc và đồng ý Điều khoản sử dụng để tạo tài khoản.',
      },
    }
  }

  if (!isPlausibleBirthDate(birth)) {
    return { fieldErrors: { birthDate: 'Ngày sinh không hợp lệ' } }
  }

  const minor = isMinor(birth)
  // Dưới 16 tuổi thì bắt buộc có email người giám hộ (NĐ 13/2023 Điều 20)
  if (minor && !guardianEmail) {
    return {
      fieldErrors: {
        guardianEmail: 'Bạn dưới 16 tuổi nên cần email của cha mẹ hoặc người giám hộ',
      },
    }
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return { fieldErrors: { email: 'Email này đã được đăng ký' } }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      birthDate: birth,
      isMinor: minor,
      guardianConsent: false,
      guardianEmail: minor ? guardianEmail : null,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
  })

  // Consent tách bạch từng mục đích, các mục không bắt buộc mặc định TẮT
  const granted: Partial<Record<ConsentPurpose, boolean>> = {}
  for (const purpose of CONSENT_PURPOSES) {
    granted[purpose] = formData.get(`consent_${purpose}`) === 'on'
  }
  await recordConsents(user.id, granted)

  if (minor && guardianEmail) {
    await issueGuardianConsent(user.id, name, guardianEmail)
  }

  // Đăng nhập luôn; jwt callback sẽ gộp bài làm của phiên khách vào tài khoản
  await signIn('credentials', { email, password, redirect: false })
  redirect(minor ? '/cai-dat/du-lieu?dangky=minor' : '/dashboard?dangky=1')
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Nhập mật khẩu'),
})

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? 'form')] ??= issue.message
    }
    return { fieldErrors }
  }

  try {
    await signIn('credentials', { ...parsed.data, redirect: false })
  } catch (e) {
    if (e instanceof AuthError) {
      // Không nói rõ email hay mật khẩu sai — tránh dò tài khoản
      return { error: 'Email hoặc mật khẩu không đúng' }
    }
    throw e
  }
  redirect('/dashboard')
}

/**
 * Hoàn tất hồ sơ sau khi đăng nhập bằng Google.
 * Google không trả ngày sinh, mà SPEC bắt buộc phải có để xác minh tuổi.
 */
const completeProfileSchema = z.object({
  birthDate: z.string().min(1, 'Bắt buộc nhập ngày sinh'),
  guardianEmail: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
})

export async function completeProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth()
  if (!session?.user?.id) redirect('/dang-nhap')

  const parsed = completeProfileSchema.safeParse({
    birthDate: formData.get('birthDate'),
    guardianEmail: formData.get('guardianEmail') ?? '',
  })
  if (!parsed.success) {
    return { fieldErrors: { birthDate: 'Ngày sinh không hợp lệ' } }
  }

  // Đăng nhập bằng Google cũng phải chấp nhận điều khoản — kiểm ở server
  if (formData.get('termsAccepted') !== 'yes') {
    return {
      fieldErrors: {
        termsAccepted: 'Bạn cần đọc và đồng ý Điều khoản sử dụng để tiếp tục.',
      },
    }
  }

  const birth = new Date(parsed.data.birthDate)
  if (!isPlausibleBirthDate(birth)) {
    return { fieldErrors: { birthDate: 'Ngày sinh không hợp lệ' } }
  }

  const minor = isMinor(birth)
  if (minor && !parsed.data.guardianEmail) {
    return {
      fieldErrors: {
        guardianEmail: 'Bạn dưới 16 tuổi nên cần email của cha mẹ hoặc người giám hộ',
      },
    }
  }

  /*
    `update` mù quáng ném PrismaClientKnownRequestError khi hàng không tồn tại, và
    lỗi đó nổ ra sau khi người dùng đã điền xong form, đọc điều khoản và bấm đồng ý.
    Token thì hợp lệ — nó chỉ trỏ tới một tài khoản đã bị xoá cứng (job dọn dẹp 48
    giờ) hoặc biến mất cùng lần dựng lại DB. Kiểm tra trước để đổi một stack trace
    lấy một lần chuyển hướng có nghĩa.
  */
  const exists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  })
  if (!exists) redirect('/dang-nhap?phien=het-han')

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      birthDate: birth,
      isMinor: minor,
      guardianEmail: minor ? parsed.data.guardianEmail : null,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
  })

  const granted: Partial<Record<ConsentPurpose, boolean>> = {}
  for (const purpose of CONSENT_PURPOSES) {
    granted[purpose] = formData.get(`consent_${purpose}`) === 'on'
  }
  await recordConsents(user.id, granted)

  if (minor && parsed.data.guardianEmail) {
    await issueGuardianConsent(user.id, user.name ?? 'Người dùng', parsed.data.guardianEmail)
  }

  /*
    BẮT BUỘC, đừng bỏ. Ngày sinh vừa ghi xuống DB, nhưng `profileComplete` nằm
    trong JWT và chỉ được tính lại khi vừa đăng nhập hoặc khi có trigger
    'update'. Không gọi cái này thì token vẫn mang profileComplete=false, và:

      /dashboard → app/(app)/layout.tsx thấy token "chưa đủ" → /hoan-tat-ho-so
      /hoan-tat-ho-so → page.tsx thấy DB "đã đủ"            → /dashboard
      → lặp vô hạn, trình duyệt nháy liên tục.

    `unstable_update` chạy lại callback `jwt` với trigger 'update', nên token
    đọc lại ngày sinh từ DB và hai bên khớp nhau trở lại.
  */
  await unstable_update({})

  redirect('/dashboard')
}

/** Gửi lại email xác nhận cho người giám hộ. */
export async function resendGuardianEmailAction(): Promise<FormState> {
  const session = await auth()
  if (!session?.user?.id) redirect('/dang-nhap')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, guardianEmail: true, isMinor: true, guardianConsent: true },
  })
  if (!user?.isMinor || user.guardianConsent || !user.guardianEmail) {
    return { error: 'Không cần gửi lại.' }
  }

  await issueGuardianConsent(session.user.id, user.name ?? 'Người dùng', user.guardianEmail)
  return { error: undefined }
}
