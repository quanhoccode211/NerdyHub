import Link from 'next/link'
import { LogoMark } from '@/components/shell/icons'

/**
 * Khung cho các trang xác thực — một cột hẹp, không có rail điều hướng.
 * Người dùng ở đây đang làm một việc duy nhất, không cần menu.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[520px]">
        <Link
          href="/"
          aria-label="Nerdy Hub — trang chủ"
          className="mb-6 flex items-center justify-center"
        >
          <LogoMark size={38} />
        </Link>
        <div className="shell-card p-7 md:p-9">{children}</div>
      </div>
    </div>
  )
}
