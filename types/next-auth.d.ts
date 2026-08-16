import type { DefaultSession } from 'next-auth'

/**
 * Mở rộng session với các trường của SPEC F6.
 * `profileComplete` = đã có ngày sinh; đăng nhập bằng Google không lấy được
 * ngày sinh nên phải hỏi thêm một bước trước khi dùng tiếp.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      isMinor: boolean
      guardianConsent: boolean
      profileComplete: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    isMinor?: boolean
    guardianConsent?: boolean
    profileComplete?: boolean
  }
}

export {}
