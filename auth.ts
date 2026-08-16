import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { fakeCompare, verifyPassword } from '@/lib/auth/password'
import { claimGuestData } from '@/lib/auth/claim-guest'

/**
 * Auth.js v5 (SPEC F6).
 *
 * Session dùng JWT chứ không phải bảng Session: Credentials provider bắt buộc
 * như vậy. Adapter vẫn cần cho Google OAuth (tạo User + liên kết Account).
 */

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Mật khẩu', type: 'password' },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw)
      if (!parsed.success) return null

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      })

      // Không có user, hoặc user đăng ký bằng Google nên chưa đặt mật khẩu.
      // Vẫn băm một lần để thời gian phản hồi không tiết lộ email nào tồn tại.
      if (!user?.passwordHash) {
        await fakeCompare(parsed.data.password)
        return null
      }

      // Tài khoản đã yêu cầu xoá thì không cho đăng nhập lại
      if (user.deletedAt) {
        await fakeCompare(parsed.data.password)
        return null
      }

      const ok = await verifyPassword(parsed.data.password, user.passwordHash)
      if (!ok) return null

      return { id: user.id, email: user.email, name: user.name, image: user.image }
    },
  }),
]

// Chỉ nạp Google provider khi đã có credentials — thiếu thì Auth.js ném lỗi
// lúc khởi tạo và làm hỏng cả đăng nhập bằng mật khẩu.
if (isGoogleConfigured()) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // gộp với tài khoản email trùng
    }),
  )
}

/*
  `unstable_update` được export ra để các server action ghi hồ sơ có thể ÉP token
  đọc lại từ database. Cần thiết vì `profileComplete` sống trong JWT chứ không
  phải trong DB: callback `jwt` bên dưới chỉ tính lại nó khi vừa đăng nhập hoặc
  khi `trigger === 'update'`. Sửa ngày sinh mà không gọi cái này thì token vẫn
  nói "chưa đủ hồ sơ" trong khi DB đã đủ — hai bên bất đồng, và hai lệnh
  chuyển hướng đối nghịch nhau sẽ thành vòng lặp vô hạn.
  Tên có tiền tố `unstable_` là do Auth.js v5 beta đặt, không phải cảnh báo của mình.
*/
export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  providers,
  pages: {
    signIn: '/dang-nhap',
    error: '/dang-nhap',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      const existing = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { deletedAt: true },
      })
      // Chặn đăng nhập vào tài khoản đang chờ xoá
      return !existing?.deletedAt
    },

    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id

      // Vừa đăng nhập xong: kéo bài làm ở chế độ khách về tài khoản này
      if (user?.id) {
        await claimGuestData(user.id)
      }

      // Nạp lại hồ sơ ở lần đầu và mỗi khi client gọi session.update()
      if (user || trigger === 'update') {
        const db = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            birthDate: true,
            isMinor: true,
            guardianConsent: true,
          },
        })
        token.role = db?.role ?? 'USER'
        token.isMinor = db?.isMinor ?? false
        token.guardianConsent = db?.guardianConsent ?? false
        // Google không trả ngày sinh -> hồ sơ chưa đủ, phải hỏi thêm một bước
        token.profileComplete = Boolean(db?.birthDate)
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = (token.role as string) ?? 'USER'
        session.user.isMinor = Boolean(token.isMinor)
        session.user.guardianConsent = Boolean(token.guardianConsent)
        session.user.profileComplete = Boolean(token.profileComplete)
      }
      return session
    },
  },
})
