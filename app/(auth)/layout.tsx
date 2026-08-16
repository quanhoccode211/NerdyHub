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
        <Link href="/" className="mb-6 flex items-center justify-center gap-3">
          <LogoMark size={38} />
          <span className="wordmark text-[20px]">Nerdy Hub</span>
        </Link>
        <div className="shell-card p-7 md:p-9">{children}</div>
      </div>
    </div>
  )
}
