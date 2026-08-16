'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { clearGuestIdentityAction } from '@/app/actions/sign-out'
import { ThemeToggle } from './theme-toggle'
import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  ChartIcon,
  HomeIcon,
  LogoMark,
  SettingsIcon,
  SparkIcon,
  WarningIcon,
} from './icons'

/**
 * Khung ứng dụng: NAV NGANG dạng pill trên cùng, nội dung bên dưới, tất cả đặt
 * trong một thẻ trắng bo 34px trên nền xám-lavender.
 *
 * Phòng thi cố ý KHÔNG dùng khung này — xem app/(exam)/layout.tsx.
 */

const NAV = [
  { href: '/dashboard', label: 'Tổng quan', Icon: HomeIcon },
  { href: '/de-thi', label: 'Kho đề', Icon: BookIcon },
  { href: '/lich-on', label: 'Lịch ôn', Icon: CalendarIcon },
  { href: '/thong-ke', label: 'Thống kê', Icon: ChartIcon },
  { href: '/tien-ich', label: 'Tiện ích', Icon: SparkIcon },
  { href: '/cai-dat', label: 'Cài đặt', Icon: SettingsIcon },
]

export type ShellUser = {
  name: string | null
  email: string | null
  isMinor: boolean
  guardianConsent: boolean
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    /*
      Viền 10px: chỉ để lộ đúng một vệt gradient quanh thẻ. Không đặt max-width —
      thẻ phải chạm sát mép ở mọi bề rộng màn hình, nếu giới hạn lại thì hai bên
      sẽ hở ra một khoảng nền rộng thay vì 10px.

      Phải khớp với app/(landing)/layout.tsx — hai khung nằm cạnh nhau khi
      chuyển trang, lệch vài px là thấy ngay.
    */
    <div className="flex min-h-screen justify-center p-[10px]">
      <div className="shell-card w-full px-4 pt-4 pb-6 md:px-6 md:pt-5 md:pb-8 lg:px-7">
        {/* ---------- NAV NGANG ---------- */}
        <header className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Trang chủ"
            className="flex flex-none items-center gap-2 rounded-pill border border-line bg-card py-1.5 pr-3.5 pl-1.5"
          >
            <LogoMark size={30} />
            <span className="wordmark hidden text-[16px] sm:inline">Nerdy Hub</span>
          </Link>

          {/*
            Icon-only nên hàng pill đủ hẹp để nằm giữa header ở mọi cỡ màn hình
            thường. Vẫn giữ overflow-x cho màn hình rất hẹp, nhưng ẩn thanh cuộn
            — nó hiện ra dưới hàng pill trông như một vệt lỗi.
          */}
          <nav
            aria-label="Điều hướng chính"
            className="no-scrollbar flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto"
          >
            {NAV.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                  /* Chỉ còn icon nên tên phải nằm ở aria-label, không thì trình
                     đọc màn hình chỉ đọc được "liên kết" trống. */
                  aria-label={label}
                  className="nav-pill"
                >
                  <Icon size={22} />
                  {/* Hiện khi rê chuột hoặc khi focus bằng bàn phím */}
                  <span className="nav-tip" aria-hidden="true">
                    {label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-none items-center gap-2">
            <button type="button" className="icon-circle" aria-label="Thông báo">
              <BellIcon size={17} />
            </button>
            <ThemeToggle />
            <AccountMenu open={menuOpen} onOpenChange={setMenuOpen} />
          </div>
        </header>

        {/* ---------- NỘI DUNG ---------- */}
        <main className="mt-6 md:mt-7">{children}</main>
      </div>
    </div>
  )
}

function AccountMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const { data: session, status } = useSession()

  const user: ShellUser | null = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        isMinor: session.user.isMinor,
        guardianConsent: session.user.guardianConsent,
      }
    : null

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-account-menu]')) onOpenChange(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open, onOpenChange])

  // Trang tĩnh nên session tới sau lần render đầu — giữ chỗ để layout không nhảy
  if (status === 'loading') {
    return <span className="h-9 w-9 flex-none rounded-full bg-soft" />
  }

  if (!user) {
    return (
      <Link href="/dang-nhap" className="btn-primary px-4 py-2 text-[14.5px]">
        Đăng nhập
      </Link>
    )
  }

  const initial = (user.name ?? user.email ?? '?').trim().charAt(0).toUpperCase()
  const needsGuardian = user.isMinor && !user.guardianConsent

  return (
    <div data-account-menu className="relative flex-none">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Tài khoản"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[16px] font-bold text-[var(--color-accent-fg)] ring-2 ring-line"
      >
        {initial}
        {needsGuardian && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warn text-white"
            title="Chờ xác nhận của người giám hộ"
          >
            <WarningIcon size={10} />
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2.5 w-[250px] rounded-2xl border border-line bg-card p-3 shadow-[0_16px_40px_rgba(24,28,45,.12)]"
        >
          <div className="border-b border-line px-2 pb-2.5">
            {/* Tên và email là NHÃN, không phải câu văn — kéo về Roboto Mono */}
            <p className="truncate font-sans text-[15px] font-semibold">
              {user.name ?? 'Tài khoản'}
            </p>
            <p className="truncate font-sans text-[13.5px] text-muted">{user.email}</p>
          </div>

          {needsGuardian && (
            <p className="mt-2 rounded-lg bg-warn-soft px-2.5 py-2 text-[13px] leading-relaxed text-warn">
              Đang chờ xác nhận của người giám hộ.
            </p>
          )}

          <div className="mt-1.5 flex flex-col">
            <Link
              href="/cai-dat/du-lieu"
              role="menuitem"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-2.5 py-2 text-[14.5px] hover:bg-soft"
            >
              Dữ liệu cá nhân
            </Link>
            <Link
              href="/bai-lam"
              role="menuitem"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-2.5 py-2 text-[14.5px] hover:bg-soft"
            >
              Bài đã làm
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  // Thứ tự quan trọng: xoá cookie khách khi phiên còn sống, rồi mới
                  // thoát. `signOut` của next-auth/react tải lại trang nên mọi thứ
                  // sau nó không chắc chạy.
                  await clearGuestIdentityAction()
                  await signOut({ callbackUrl: '/' })
                })
              }
              className="rounded-lg px-2.5 py-2 text-left text-[14.5px] text-bad hover:bg-bad-soft disabled:opacity-60"
            >
              {pending ? 'Đang thoát…' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Header của trang: lời chào nhỏ + tiêu đề lớn + slot bên phải (ô tìm kiếm…).
 * Theo đúng khối "Welcome back / Let's Make Learning Fun!" của ảnh tham chiếu.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  actions,
}: {
  /** Dòng nhỏ phía TRÊN tiêu đề — kiểu "Chào Linh 👋" */
  eyebrow?: string
  title: string
  /** Dòng mô tả phía DƯỚI tiêu đề */
  subtitle?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[15px] text-muted">{eyebrow}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[27px] leading-tight font-bold tracking-[-0.02em] md:text-[35px]">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && <p className="mt-2 text-[15.5px] text-muted-strong">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2.5">{actions}</div>}
    </header>
  )
}

/** Tiêu đề khối trong thẻ: icon vuông + chữ + slot hành động bên phải. */
export function CardHeader({
  icon,
  title,
  meta,
  actions,
}: {
  icon: React.ReactNode
  title: string
  meta?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="chip-icon">{icon}</span>
        <h2 className="truncate text-[18px] font-bold tracking-[-0.01em]">{title}</h2>
        {meta}
      </div>
      {actions && <div className="flex flex-none items-center gap-1.5">{actions}</div>}
    </div>
  )
}
