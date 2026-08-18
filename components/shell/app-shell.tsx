'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { clearGuestIdentityAction } from '@/app/actions/sign-out'
import {
  ACTIVE_PILL_VT_NAME,
  APP_LEAVING_CLASS,
  BRAND_VT_NAME,
  EXIT_APP,
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

      Trần thời gian = chỉ số lớn nhất * --pop-enter-step + --pop-enter-dur.

      Chỉ số lớn nhất là 8, không phải 6: công thức trong globals.css là
      `--pop-row * 2 + --pop-col`, mà row cao nhất là 3 và col cao nhất là 2.
      Ghi chú cũ ghi 6 nên trần tính ra 850 → làm tròn 900, trong khi dãy thật
      chạy tới 8 * 55 + 520 = 960ms. Tức thẻ cuối cùng bị gỡ class giữa chừng và
      nhảy phịch về trạng thái cuối — mất đúng cái nhịp mềm mà cả hiệu ứng này
      sinh ra để có.

      Nay: 8 * 26ms + 360ms = 568ms, làm tròn lên 620ms.
    */
    const t = window.setTimeout(() => setEntering(false), 620)
    return () => window.clearTimeout(t)
  }, [entering])

  /*
    CHIỀU RA: gỡ `.app-leaving` khỏi <html> lúc AppShell unmount.

    Unmount là tín hiệu chính xác cho "đã rời hẳn ứng dụng" — trang giới thiệu
    dựng layout riêng nên cả khung này bị tháo. Gỡ sớm hơn thì những thẻ chưa
    tới lượt bật lại đầy đủ trong khung hình cuối trước khi trang đổi.

    Cờ này KHÔNG tự hết hạn, nên không gỡ là lần sau quay lại ứng dụng các thẻ
    dashboard chạy pop-out ngay khi vừa hiện ra. Còn chuyện gỡ đúng lúc nào so
    với khung hình đầu của trang giới thiệu thì không quan trọng: selector bên
    globals.css neo vào `.app-main`, mà class đó chỉ có ở khung này.
  */
  useEffect(() => {
    return () => document.documentElement.classList.remove(APP_LEAVING_CLASS)
  }, [])

  /* Vị trí tab đang mở trên rail — dùng để suy ra HƯỚNG trượt, xem NAV.map dưới. */
  const activeIndex = NAV.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  )

  return (
    /*
      Viền 15px: chỉ để lộ đúng một vệt gradient quanh thẻ. Không đặt max-width —
      thẻ phải chạm sát mép ở mọi bề rộng màn hình, nếu giới hạn lại thì hai bên
      sẽ hở ra một khoảng nền rộng thay vì 15px.

      Từng là 10px. Nới thêm 5px mỗi phía sau khi nền đổi sang bảng màu mesh mới:
      vệt 10px quá hẹp để đọc ra ba cực màu, chỉ thấy một viền nhàn nhạt.

      Phải khớp với app/(landing)/layout.tsx — hai khung nằm cạnh nhau khi
      chuyển trang, lệch vài px là thấy ngay. Sửa một bên mà quên bên kia thì con
      dấu ở góc nhảy ngang đúng bằng khoảng chênh, mà nó là mốc neo đứng yên
      giữa hiệu ứng.
    */
    <div className="flex min-h-screen justify-center p-[15px]">
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
          {/*
            `SlideLink` + `EXIT_APP`, không phải `<Link>` trơn: bấm con dấu là
            rời hẳn ứng dụng về trang giới thiệu, và chặng đó có hiệu ứng riêng —
            các khối nội dung rút đi lần lượt rồi mới điều hướng. Đây là chiều
            ngược của nút CTA bên trang giới thiệu (components/landing/enter-button.tsx).

            KHÔNG phải SLIDE_FORWARD / SLIDE_BACK: hai kiểu đó đi qua View
            Transitions API, mà ở đó trang cũ chỉ còn là ảnh chụp tĩnh nên không
            có thẻ riêng lẻ nào để cho rút đi lần lượt. Xem EXIT_APP.
          */}
          <SlideLink
            href="/"
            type={EXIT_APP}
            aria-label="Nerdy Hub — trang chủ"
            className="flex flex-none items-center"
            /*
              Mốc neo của hiệu ứng trượt: đặt tên view-transition thì con dấu
              được nhấc ra khỏi ảnh chụp chung và tự ghép cặp với con dấu bên
              trang giới thiệu. Hai bên đã nằm đúng cùng toạ độ nên cặp này
              "morph" bằng không — mắt thấy nó đứng yên trong lúc mọi thứ khác
              trượt qua. Xem components/shell/nav-slide.tsx.

              Vẫn giữ dù chặng EXIT_APP không dùng view transition: con dấu còn
              là mốc neo của SLIDE_FORWARD / SLIDE_BACK khi đổi tab.
            */
            style={{ viewTransitionName: BRAND_VT_NAME }}
          >
            <LogoMark size={BRAND_LOGO_SIZE} />
          </SlideLink>

          {/*
            HÀNG TAB HIỆN NGUYÊN VẸN Ở MỌI BỀ RỘNG NÓ VỪA — và chỉ cuộn khi
            không còn cách nào khác.

            Yêu cầu cũ là bỏ hẳn cuộn ngang: sáu icon là mốc điều hướng luôn
            phải thấy hết, mà thanh cuộn thì giấu bớt tab đi. Yêu cầu đó vẫn
            đúng và vẫn được giữ ở MỌI bề rộng mà hàng tab vừa khung.

            Nhưng ở khổ điện thoại nó bất khả thi, và đã đo ra con số: tại
            375px, header cần 720px (con dấu 70 + hàng tab 473 + cụm nút 153 +
            hai gap 24) trong khi chỉ có 311px. Ngay cả khi bóp đệm pill về 0,
            sáu icon 28px vẫn là 168px, cộng hai đầu vẫn 415px — không đời nào
            vừa.

            Bỏ cuộn KHÔNG làm hàng tab hiện đủ; nó chỉ đẩy phần thừa ra ngoài
            và kéo CẢ TRANG rộng ra. Đo tại /dashboard 375px: `<html>` có
            scrollWidth 751 trên clientWidth 375 — người dùng vuốt ngang thì cả
            thẻ trắng, nội dung, mọi thứ đều trôi, và các tab vẫn khuất y như
            khi có thanh cuộn. Tức là đánh đổi lấy một thứ tệ hơn hẳn.

            Nên: `min-w-0` cho <nav> co được, `overflow-x-auto` cho hàng tab tự
            cuộn TRONG khung của nó. `overflow-x: auto` chỉ sinh cuộn khi nội
            dung thật sự tràn, nên từ ~800px trở lên không có gì đổi — không
            một pixel nào khác trước.
          */}
          <nav
            aria-label="Điều hướng chính"
            className="flex min-w-0 flex-1 items-center justify-center"
          >
            {/*
              Một thanh nền liền bọc cả hàng tab — xem .nav-rail trong globals.css.

              `viewTransitionName` ở đây KHÔNG phải để làm hiệu ứng, mà để hàng
              tab thoát khỏi ảnh chụp tĩnh `root` và cập nhật ngay — xem
              NAV_RAIL_VT_NAME.

              `max-w-full` là bắt buộc đi kèm `overflow-x-auto`: .nav-rail là
              `inline-flex` nên nó co giãn theo nội dung chứ không theo cha —
              thiếu dòng này thì nó cứ rộng 473px và chẳng có gì để mà cuộn.
            */}
            <div
              className="nav-rail no-scrollbar max-w-full overflow-x-auto"
              style={{ viewTransitionName: NAV_RAIL_VT_NAME }}
            >
              {NAV.map(({ href, label, Icon }, i) => {
                /*
                  HAI KHÁI NIỆM KHÁC NHAU, đừng gộp lại làm một.

                  `inSection` — đang ở đâu đó BÊN TRONG nhánh này, kể cả các
                  trang con. Quyết định phần NHÌN: ô đen đánh dấu và màu icon.
                  Đứng ở /tien-ich/pomodoro thì tab Tiện ích vẫn phải sáng, nếu
                  không người dùng mất dấu mình đang ở khu nào.

                  `isCurrent` — đang đứng ĐÚNG trang gốc của nhánh. Quyết định
                  việc còn bấm được hay không.

                  Trước đây chỉ có một biến dùng cho cả hai việc, nên từ
                  /tien-ich/pomodoro không có cách nào bấm về /tien-ich: tab bị
                  khoá vì "đang ở trong nhánh đó rồi". Mà đó lại đúng là lúc
                  người ta cần nó nhất — nút quay về mặt bằng chính của khu.
                */
                const inSection = pathname === href || pathname.startsWith(`${href}/`)
                const isCurrent = pathname === href

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
                    {inSection ? (
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
                  TAB CỦA ĐÚNG TRANG ĐANG ĐỨNG KHÔNG PHẢI LINK — là <span>.

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

                  ĐIỀU KIỆN LÀ `isCurrent`, KHÔNG PHẢI `inSection`: ở trang con
                  thì bấm tab vẫn có nghĩa — nó đưa về trang gốc của nhánh, tức
                  một cú điều hướng thật, không phải cú nháy tại chỗ.
                */
                if (isCurrent) {
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
                    /*
                      `inSection` chứ không phải `false`: ở trang con thì tab
                      này vẫn phải sáng như đang mở, chỉ khác là bấm được. Gõ
                      cứng `false` ở đây là ô đen vẫn vẽ (nó theo `inSection`)
                      nhưng icon lại ăn màu của tab tắt — trắng trên trắng.
                    */
                    data-active={inSection}
                    /*
                      "true" chứ không phải "page": người dùng KHÔNG đứng ở
                      trang này, họ đang ở một trang con của nó. Dùng "page" ở
                      đây là nói sai với trình đọc màn hình, mà bỏ trống hẳn thì
                      mất luôn thông tin "bạn đang trong khu này".
                    */
                    aria-current={inSection ? 'true' : undefined}
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
          {/*
            `relative z-50` LÀ HỆ QUẢ BẮT BUỘC của dòng `viewTransitionName` ngay
            dưới, không phải trang trí.

            `view-transition-name` biến phần tử thành một STACKING CONTEXT. Menu
            tài khoản bên trong là `absolute z-50`, nhưng z-index của nó từ đó
            chỉ còn tranh chấp BÊN TRONG cụm này — ra ngoài, cả cụm tham gia thứ
            tự vẽ với `z-index: auto`, mà `<main>` thì nằm sau trong DOM nên các
            thẻ nội dung phủ lên trên menu. Triệu chứng đo được: menu bị thẻ
            "Giờ luyện tập" cắt ngang.

            Nâng z-index của CHÍNH CỤM lên là cách chữa, chứ không phải nâng
            z-index của menu — menu có tăng lên bao nhiêu cũng không thoát được
            stacking context của cha.

            `relative` ở đây không đổi bố cục (cụm vẫn nằm trong dòng flex), chỉ
            để z-index còn tác dụng nếu sau này ai đổi header khỏi flex.
          */}
          <div
            className="relative z-50 flex flex-none items-center gap-2"
            style={{ viewTransitionName: HEADER_ACTIONS_VT_NAME }}
          >
            {/*
              Hiệu ứng nảy đặt trên TỪNG NÚT, không phải trên cả cụm — và ở đây
              chỉ có chuông mang nó.

              Bản đầu gắn cho cả cụm, nên avatar tài khoản nảy theo. Thành ra
              hai hiệu ứng chồng lên cùng một vật: pill bên trang giới thiệu
              đang thu về đúng hình tròn ấy (xem `.account-name`), mà tròn xong
              thì nó lại pop-out rồi pop-in một lần nữa. Mắt đọc ra là vòng tròn
              biến mất rồi hiện lại, chứ không phải một vật đi liền mạch.

              Avatar vì vậy đứng yên xuyên suốt, đúng vai trò mốc neo mà con dấu
              thương hiệu vẫn giữ ở đầu kia hàng header. Chuông thì không có gì
              thay thế nên vẫn cần nảy.

              `header-action-pop-in` là class RIÊNG chứ không tái dùng `.pop-in`:
              lúc AppShell render khung hình đầu, cờ `.pop-leaving` vẫn còn trên
              <html> (effect chưa chạy), mà `:root.pop-leaving .pop-in` là luật
              chạy pop-OUT — nút sẽ tắt phụt đúng lúc đáng ra phải hiện.
            */}
            <button
              type="button"
              className={`icon-circle header-action-pop${entering ? ' header-action-pop-in' : ''}`}
              aria-label="Thông báo"
            >
              <BellIcon size={17} />
            </button>
            <AccountMenu open={menuOpen} onOpenChange={setMenuOpen} />
          </div>
        </header>

        {/* ---------- NỘI DUNG ---------- */}
        {/*
          CHỈ phần này trượt. Thẻ trắng, rail điều hướng, con dấu và cụm nút bên
          phải đều đứng nguyên — chúng là cái khung để mắt bám vào, khung mà trôi
          theo thì hiệu ứng đọc ra như bị đẩy cả cửa sổ.
        */}
        {/*
          `app-main` là class CỐ ĐỊNH, khác hẳn `enter-stagger` bên cạnh vốn là
          class tạm. Nó chỉ tồn tại để làm cái neo cho selector chiều ra trong
          globals.css: `main > div > *` trơn sẽ khớp luôn các khối hero của trang
          giới thiệu, và cờ `.app-leaving` chỉ cần nán lại một khung hình sau khi
          trang đổi là hero vừa hiện ra đã bị rút đi ngay.
        */}
        <main
          className={`app-main mt-6 md:mt-7${entering ? ' enter-stagger' : ''}`}
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
    return <span className="h-8 w-8 flex-none rounded-full bg-soft" />
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
        /*
          `h-8 w-8` + `text-[15px]` PHẢI khớp avatar trong pill ở góc phải trang
          giới thiệu (components/landing/landing-auth.tsx) — cùng một vòng tròn,
          người dùng thấy nó ở cả hai khung.

          Từng là `h-9 w-9` + `text-[16px]`, tức 36px so với 32px bên kia. Lệch
          đó đọc ra ngay giữa lúc chuyển trang: pill bên trang giới thiệu thu về
          đúng hình tròn này, tròn xong thì nó nở thêm 4px một cái. Lấy số NHỎ
          hơn chứ không nống bên kia lên, vì 32px là cỡ đang nằm vừa trong pill.

          Vành `ring-2` không tính vào phép so: bên kia avatar nằm trong pill có
          viền riêng, bên này vành chính là thứ thay cho cái viền đó.
        */
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[15px] font-bold text-[var(--color-accent-fg)] ring-2 ring-line"
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
