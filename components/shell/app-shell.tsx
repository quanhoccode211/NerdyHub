'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { clearGuestIdentityAction } from '@/app/actions/sign-out'
import { ThemeToggle } from './theme-toggle'
import {
  ACTIVE_PILL_VT_NAME,
  BRAND_VT_NAME,
  HEADER_ACTIONS_VT_NAME,
  NAV_RAIL_VT_NAME,
  PAGE_CONTENT_STYLE,
  SLIDE_BACK,
  SLIDE_FORWARD,
  SlideLink,
  clearEnteringApp,
  isEnteringApp,
} from './nav-slide'
import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  ChartIcon,
  HomeIcon,
  BRAND_LOGO_SIZE,
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

  /**
   * "Vừa bước từ trang giới thiệu vào" — bật hiệu ứng các khối nảy lên lần lượt.
   *
   * Đọc cờ NGAY LÚC RENDER chứ không phải trong effect, và đó là điều bắt buộc:
   * `.enter-stagger` phải có mặt ở khung hình ĐẦU TIÊN. Chờ tới effect thì các
   * thẻ đã kịp vẽ ra đầy đủ một nhịp rồi mới nhảy về trong suốt để chạy
   * animation — thành ra một cú nháy.
   *
   * Không lo lệch hydrate: cờ chỉ được bật ngay trước một lần điều hướng phía
   * client, mà lần đó thì AppShell dựng thẳng trên trình duyệt, không có bản
   * render sẵn từ server để mà lệch.
   */
  const [entering, setEntering] = useState(isEnteringApp)

  useEffect(() => {
    if (!entering) return

    /*
      Trang giới thiệu đã tháo xong -> gỡ class thoát khỏi <html>. Gỡ ở đây chứ
      không phải ngay sau `router.push`: gỡ sớm là những element chưa tới lượt
      bật lại đầy đủ trong đúng khung hình cuối trước khi trang đổi.
    */
    document.documentElement.classList.remove('pop-leaving')
    clearEnteringApp()

    /*
      Gỡ `.enter-stagger` sau khi dãy chạy xong. BẮT BUỘC phải gỡ: AppShell
      không unmount khi đổi tab giữa các trang chức năng, nên class còn lại là
      mọi lần đổi tab sau đó cũng nảy một loạt thẻ — tức đổi luôn hiệu ứng
      trượt vốn phải giữ nguyên.

      Trần thời gian = chỉ số lớn nhất (6) * --pop-enter-step (55ms)
      + --pop-dur (520ms), làm tròn lên.
    */
    const t = window.setTimeout(() => setEntering(false), 900)
    return () => window.clearTimeout(t)
  }, [entering])

  /* Vị trí tab đang mở trên rail — dùng để suy ra HƯỚNG trượt, xem NAV.map dưới. */
  const activeIndex = NAV.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  )

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
        {/*
          `min-h-[var(--brand-row-height)]` ở đây là THỪA trong trường hợp
          thường — hàng nav đã cao đúng bằng đó rồi. Khai vẫn hơn: nó nói ra
          rằng chiều cao hàng này là một hợp đồng dùng chung với trang giới
          thiệu (xem app/(landing)/layout.tsx), chứ không phải hệ quả tình cờ
          của cỡ pill. Con dấu là mốc neo đứng yên giữa hiệu ứng trượt, hai bên
          lệch vài px là nó giật.
        */}
        <header className="flex min-h-[var(--brand-row-height)] items-center gap-3">
          {/*
            Không bọc pill như hàng nav bên cạnh: pill cũ tồn tại để ôm con dấu
            CÙNG chữ "Nerdy Hub". Bỏ chữ đi mà giữ pill thì còn lại một vành
            viền rộng quây quanh mỗi cặp kính, đọc ra như một nút bấm chứ không
            phải thương hiệu.
          */}
          <Link
            href="/"
            aria-label="Nerdy Hub — trang chủ"
            className="flex flex-none items-center"
            /*
              Mốc neo của hiệu ứng trượt: đặt tên view-transition thì con dấu
              được nhấc ra khỏi ảnh chụp chung và tự ghép cặp với con dấu bên
              trang giới thiệu. Hai bên đã nằm đúng cùng toạ độ nên cặp này
              "morph" bằng không — mắt thấy nó đứng yên trong lúc mọi thứ khác
              trượt qua. Xem components/shell/nav-slide.tsx.
            */
            style={{ viewTransitionName: BRAND_VT_NAME }}
          >
            <LogoMark size={BRAND_LOGO_SIZE} />
          </Link>

          {/*
            KHÔNG cuộn ngang. Hàng tab hiện nguyên vẹn ở mọi bề rộng.

            Trước đây chỗ này là `overflow-x-auto` + `no-scrollbar` để phòng màn
            hình rất hẹp. Bỏ đi theo yêu cầu: sáu icon là một mốc điều hướng
            luôn phải thấy hết, mà thanh cuộn thì giấu bớt tab đi và người dùng
            không có dấu hiệu nào cho biết còn tab nữa ở ngoài rìa.

            `min-w-0` cũng bỏ theo: nó tồn tại để cho phép hàng tab CO LẠI nhỏ
            hơn nội dung — đúng cái điều kiện sinh ra thanh cuộn. Giữ lại thì
            hàng tab vẫn bị bóp, chỉ khác là không cuộn được nữa.
          */}
          <nav
            aria-label="Điều hướng chính"
            className="flex flex-1 items-center justify-center"
          >
            {/*
              Một thanh nền liền bọc cả hàng tab — xem .nav-rail trong globals.css.

              `viewTransitionName` ở đây KHÔNG phải để làm hiệu ứng, mà để hàng
              tab thoát khỏi ảnh chụp tĩnh `root` và cập nhật ngay — xem
              NAV_RAIL_VT_NAME.
            */}
            <div className="nav-rail" style={{ viewTransitionName: NAV_RAIL_VT_NAME }}>
              {NAV.map(({ href, label, Icon }, i) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)

                /*
                  Ruột của pill giống hệt nhau ở cả hai nhánh, tách ra để nhánh
                  "đang mở" và nhánh "đi được" không trôi khỏi nhau khi sửa.
                */
                const inner = (
                  <>
                    {/*
                      Ô đen là một phần tử NỀN riêng, không phải cái pill này.

                      Chỉ nó mang `view-transition-name`, nên chỉ nó bay khi đổi
                      tab — icon nằm ngoài ảnh chụp và đứng yên tại chỗ. Gắn tên
                      lên cả pill (bản trước) là icon lọt vào ảnh, và giữa đường
                      có hai icon chồng mờ lên nhau.

                      Chỉ dựng cho pill đang mở: tên view-transition phải DUY NHẤT
                      trong một trang, có hai cái là trình duyệt bỏ qua cả nhóm.
                    */}
                    {active ? (
                      <span
                        className="nav-pill-indicator"
                        aria-hidden="true"
                        style={{ viewTransitionName: ACTIVE_PILL_VT_NAME }}
                      />
                    ) : null}
                    {/* 28 chứ không 22: pill đã to gấp rưỡi, icon cũ trông lọt thỏm
                        giữa khoảng trống. Đổi số này thì sửa luôn padding của
                        .nav-pill để giữ nguyên kích thước pill — xem globals.css. */}
                    <Icon size={28} />
                    {/* Hiện sau khi rê chuột và giữ 2 giây — xem .nav-tip */}
                    <span className="nav-tip" aria-hidden="true">
                      {label}
                    </span>
                  </>
                )

                /*
                  TAB ĐANG MỞ KHÔNG PHẢI LINK — là <span>.

                  Bấm lại chính tab đang đứng sẽ chạy lại nguyên bộ hiệu ứng
                  chuyển trang: ô đen bay từ pill đó về đúng pill đó, icon đổi
                  màu một vòng, nội dung trượt ra rồi trượt vào cùng một trang.
                  Một chuyển động không nói lên điều gì, và người dùng đọc ra là
                  giao diện bị nháy.

                  Bỏ luôn thẻ <a> chứ không chỉ chặn onClick: chặn onClick vẫn
                  còn chuột giữa, Ctrl+click, Enter khi focus bằng bàn phím và
                  cả menu chuột phải — mỗi lối đó là một cách nữa để lặp lại
                  đúng cú nháy này. `aria-current="page"` là cách chuẩn để báo
                  "bạn đang ở đây" cho trình đọc màn hình mà không cần link.
                */
                if (active) {
                  return (
                    <span
                      key={href}
                      data-active="true"
                      aria-current="page"
                      /* Chỉ còn icon nên tên phải nằm ở aria-label, không thì trình
                         đọc màn hình chỉ đọc được một ô trống. */
                      aria-label={label}
                      className="nav-pill"
                    >
                      {inner}
                    </span>
                  )
                }

                return (
                  <SlideLink
                    key={href}
                    href={href}
                    data-active={false}
                    aria-label={label}
                    className="nav-pill"
                    /*
                      Hướng trượt đọc từ vị trí tab trên rail, không phải từ lịch
                      sử duyệt. Bấm sang tab bên phải thì nội dung lùi sang trái;
                      bấm ngược lại thì nó trôi ngược lại.

                      Trang không nằm trong rail (trang kết quả, xem lại bài) cho
                      `activeIndex = -1`, nên mọi tab đều tính là "bên phải" và
                      trượt tới — đúng hướng, vì từ đó bấm tab nào cũng là rời một
                      nhánh con để về mặt bằng chính.
                    */
                    type={i > activeIndex ? SLIDE_FORWARD : SLIDE_BACK}
                  >
                    {inner}
                  </SlideLink>
                )
              })}
            </div>
          </nav>

          {/*
            Đặt tên để cụm nút này ĐỨNG YÊN khi đổi tab, y như con dấu và hàng
            nav — xem HEADER_ACTIONS_VT_NAME. Ba nút giống hệt nhau ở mọi trang
            nên không có gì để chuyển tiếp; nằm trong ảnh chụp `root` thì chúng
            bị cross-fade theo cả trang và đọc ra như cũng đang đổi.
          */}
          <div
            className="flex flex-none items-center gap-2"
            style={{ viewTransitionName: HEADER_ACTIONS_VT_NAME }}
          >
            <button type="button" className="icon-circle" aria-label="Thông báo">
              <BellIcon size={17} />
            </button>
            <ThemeToggle />
            <AccountMenu open={menuOpen} onOpenChange={setMenuOpen} />
          </div>
        </header>

        {/* ---------- NỘI DUNG ---------- */}
        {/*
          CHỈ phần này trượt. Thẻ trắng, rail điều hướng, con dấu và cụm nút bên
          phải đều đứng nguyên — chúng là cái khung để mắt bám vào, khung mà trôi
          theo thì hiệu ứng đọc ra như bị đẩy cả cửa sổ.
        */}
        <main
          className={`mt-6 md:mt-7${entering ? ' enter-stagger' : ''}`}
          style={PAGE_CONTENT_STYLE}
        >
          {children}
        </main>
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
      /*
        `btn-secondary` (nền sáng, chữ tối) chứ không phải `btn-primary`: phải
        khớp với nút cùng chức năng ở góc phải trang giới thiệu — xem
        components/landing/landing-auth.tsx. Cùng một hành động mà hai trang cho
        hai màu thì người dùng đọc ra là hai thứ khác nhau.

        Đổi cả kích thước theo: `btn-secondary` có viền 1px nên cao hơn 2px, và
        vì nút canh giữa theo hàng header nên chênh đó đẩy mép trên lệch 1px
        giữa hai trang. Giờ cả hai đều 108,7×39,8, lề phải 29px.
      */
      <Link href="/dang-nhap" className="btn-secondary px-4 py-2 text-[14.5px]">
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
