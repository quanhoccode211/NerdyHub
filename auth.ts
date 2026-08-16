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

    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      if (!token.sub) return token

      /*
        ĐỐI CHIẾU VỚI DATABASE Ở MỌI LẦN ĐỌC PHIÊN, không chỉ lúc đăng nhập hay khi
        client gọi session.update().

        Bản cũ chỉ nạp lại ở hai mốc đó, nên giữa hai mốc token là một lời khẳng
        định không ai kiểm chứng — và nó có hạn 30 ngày. Hai hậu quả đã gặp:

          • Tài khoản biến mất (job xoá cứng sau 48 giờ ở scripts/purge-deleted-users.ts,
            hoặc DB dev dựng lại) mà token vẫn hợp lệ. Mọi truy vấn theo
            `session.user.id` trỏ vào hư không; chỗ vỡ đầu tiên là
            `prisma.user.update()` ở màn hình hoàn tất hồ sơ, ném
            PrismaClientKnownRequestError thẳng vào mặt người dùng.

          • Tệ hơn: `(app)/layout.tsx` thấy hồ sơ "chưa đủ" nên đá sang
            /hoan-tat-ho-so, trang đó thấy tài khoản không tồn tại nên đá về
            /dang-nhap, mà /dang-nhap thấy phiên còn hạn nên đá sang /dashboard —
            vòng lặp kín, màn hình nháy liên tục và không vào được đâu cả.

        Trả `null` là bảo Auth.js huỷ phiên. Chốt ở đây thay vì rải guard ở từng
        trang: chừng nào token còn được coi là hợp lệ thì mọi trang đều phải tự đề
        phòng, và chỉ cần một trang quên là vòng lặp quay lại.

        Giá phải trả là một truy vấn theo khoá chính mỗi lần `auth()` chạy. Đổi lại
        `role` và `guardianConsent` cũng luôn khớp DB — trước đây phân quyền vẫn đi
        theo ảnh chụp tại thời điểm đăng nhập.
      */
      const db = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          role: true,
          birthDate: true,
          isMinor: true,
          guardianConsent: true,
          deletedAt: true,
        },
      })
      if (!db || db.deletedAt) return null

      token.role = db.role
      token.isMinor = db.isMinor
      token.guardianConsent = db.guardianConsent
      // Google không trả ngày sinh -> hồ sơ chưa đủ, phải hỏi thêm một bước
      token.profileComplete = Boolean(db.birthDate)

      /*
        Kéo bài làm ở chế độ khách về tài khoản — CHỈ SAU khi đã xác nhận tài khoản
        có thật. `claimGuestData` ghi `userId` vào Attempt, nên chạy trước bước kiểm
        tra là đâm thẳng vào lỗi khoá ngoại và làm hỏng cả lần đăng nhập.
      */
      if (user?.id) {
        await claimGuestData(user.id)
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
