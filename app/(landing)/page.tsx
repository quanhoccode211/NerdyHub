import type { Metadata } from 'next'
import Image from 'next/image'
import { EnterButton } from '@/components/landing/enter-button'
import { randomPun } from '@/lib/puns'

export const metadata: Metadata = {
  title: 'Kho đề & thi thử online có bấm giờ — VSTEP, TOPIK, THPT Quốc gia',
  description:
    'Làm đề thi thử online có bấm giờ như phòng thi thật. Chấm điểm tự động, so sánh với người khác, phân tích điểm yếu. Miễn phí, không cần đăng nhập.',
  alternates: { canonical: '/' },
}

/**
 * DỰNG LẠI MỖI REQUEST. Trước đây là `revalidate = 3600` (ISR một giờ).
 *
 * Bắt buộc phải đổi, không phải chuyện tuỳ chọn: yêu cầu là mỗi lần vào trang
 * ra một câu pun khác. Trang còn cache thì `randomPun()` chỉ chạy đúng một lần
 * lúc dựng, kết quả nằm cứng trong HTML đã lưu, và MỌI khách trong suốt khoảng
 * cache đều nhận cùng một câu — random mà như không.
 *
 * Cái giá phải trả nhỏ hơn thường lệ vì trang này KHÔNG đọc database: nó chỉ
 * bốc một phần tử trong mảng rồi render. Mất phần phục vụ từ cache CDN và mỗi
 * lượt xem tốn một lần gọi hàm, đổi lại không phải nhét JS xuống client chỉ để
 * đổi một dòng chữ.
 *
 * KHÔNG ảnh hưởng SEO theo nghĩa nội dung: bot vẫn nhận HTML đầy đủ, `metadata`
 * ở trên là tĩnh và không dính tới pun.
 *
 * `revalidate` bị bỏ hẳn chứ không để lại: đi cùng `force-dynamic` thì nó vô
 * hiệu, mà để đó là người sau đọc ra hai chính sách cache mâu thuẫn nhau.
 */
export const dynamic = 'force-dynamic'

/**
 * Ba khối minh hoạ, mỗi khối một file SVG riêng.
 *
 * `width`/`height` phải khớp thuộc tính cùng tên trong từng file — chúng chỉ nói
 * cho next/image biết TỈ LỆ để chừa sẵn chỗ, không quyết định ảnh hiện to nhỏ.
 *
 * TỈ LỆ ĐÃ ĐỔI so với bộ panel cũ, và đây là chỗ dễ hụt chân nhất: ba tấm webp
 * cũ đều CAO hơn rộng (~0,89–0,92 lần chiều cao), ba file SVG này thì NGƯỢC LẠI
 * (~1,19–1,24). Cùng một chiều cao, bộ mới chiếm nhiều hơn ~34% bề ngang. Mọi
 * con số chặn ngang tính theo bộ cũ đều sai từ đây, nên chúng được viết lại
 * thành công thức chia đều thay vì hằng số vw đo tay.
 *
 * `alt` để rỗng: ảnh chỉ trang trí, phần đọc cho screen reader nằm ở thẻ <p>
 * sr-only bên dưới. Thứ tự mảng này và mảng ALT phải trùng nhau.
 */
const MASCOTS = [
  { src: '/hero/mascot-toan.svg', width: 2090, height: 1686 },
  { src: '/hero/mascot-tieng-anh.svg', width: 2042, height: 1720 },
  { src: '/hero/mascot-tieng-han.svg', width: 2024, height: 1692 },
] as const

/** Khoảng cách giữa ba khối, px. Phải khớp `gap-10` ở section (Tailwind 10 = 40px). */
const GAP_PX = 40

/**
 * Bề rộng của TỪNG ảnh, chia theo đúng tỉ lệ của chính nó.
 *
 * Đây là cách DUY NHẤT vừa lấp kín bề ngang vừa giữ ba khối pastel bằng nhau về
 * chiều cao. Chia đều tam phần thì hỏng: ba ảnh có tỉ lệ khác nhau (1,24 / 1,19
 * / 1,20) nên cùng một bề rộng sẽ cho ba chiều cao khác nhau, và đáy các khối
 * pastel so le — đúng cái lỗi mà ghi chú cũ ở đây đã cảnh báo khi khuyên "đừng
 * ép cùng bề rộng".
 *
 * Cho mỗi ảnh phần bề rộng tỉ lệ THUẬN với tỉ lệ riêng của nó thì cả ba quy về
 * cùng một chiều cao:
 *
 *   w_i = (W - 2*GAP) * r_i / Σr        với r_i = width_i / height_i
 *   => h_i = w_i / r_i = (W - 2*GAP) / Σr   — không còn phụ thuộc i
 *
 * Nhờ vậy chiều cao là hệ quả, không phải thứ phải gõ tay: đổi file SVG hay đổi
 * GAP_PX đều tự ra đúng, không có hằng số đo tay nào để mà lỗi thời.
 */
const TOTAL_RATIO = MASCOTS.reduce((s, m) => s + m.width / m.height, 0)

function panelWidth(m: { width: number; height: number }): string {
  const share = m.width / m.height / TOTAL_RATIO
  return `calc((100% - ${GAP_PX * 2}px) * ${share.toFixed(6)})`
}

const ALT = [
  'Thầy giáo giảng bài toán trước bảng',
  'Bạn nữ đọc sách tiếng Anh',
  'Bạn nữ học tiếng Hàn trên máy tính bảng',
]

export default function LandingPage() {
  const pun = randomPun()

  return (
    /*
      md:justify-start + md:mt-auto ở hàng liên hệ (thay cho justify-center):
      canh giữa thì phần thừa chia đều trên dưới nên cụm minh hoạ trôi xuống
      giữa trang. Ghim từ trên xuống rồi đẩy hàng liên hệ xuống đáy thì khoảng
      thừa dồn vào giữa mô tả và hàng liên hệ, minh hoạ nằm sát header.
      Dưới md vẫn canh giữa — dải đó cuộn được nên không cần ghim.
    */
    /*
      `--pop-last` = chỉ số LỚN NHẤT trong đám `--pop-i` bên dưới (7 element,
      0..6). Lúc rời trang, CSS lấy `--pop-last - --pop-i` để lộn ngược thứ tự
      hiện ra — xem `.pop-leaving` trong globals.css. Thêm hay bớt một element
      có `--pop-i` thì phải sửa số này, nếu không phần tử cuối rời đi trước cả
      khi nó tới lượt hoặc chờ hụt một nhịp.
    */
    /*
      `max-w` + `mx-auto`: cụm hero căn GIỮA thay vì trải hết bề ngang thẻ trắng.

      Chọn chặn bề ngang chứ không dồn chữ vào giữa theo kiểu căn giữa từng dòng:
      bố cục hai cột (khẩu hiệu trái / mô tả phải) đã được chỉnh theo breakpoint
      `xl` với lý do riêng — xem ghi chú ở khối <section> chữ bên dưới — dồn vào
      giữa là phá luôn phần đó. Dưới 1240px con số này không đổi được gì, nên
      máy tính xách tay và điện thoại y như cũ; chỉ màn hình rộng mới thấy khác.
    */
    /*
      `md:-mt-6 md:mb-6` — NÂNG CẢ CỤM LÊN 24px, không đổi cỡ thứ gì.

      Cặp lề âm/dương vẫn đi cùng nhau, nhưng lý do đã đổi. Hồi hàng minh hoạ
      còn `flex-1`, chỉ đặt lề âm là phần chiều cao khả dụng tăng 24px và ảnh
      nở ra chừng đó. Nay ảnh cao cố định nên không còn nguy cơ ấy; lề dương giữ
      lại để tổng chỗ chiếm vẫn bằng 0, tức hàng liên hệ ở đáy không bị đẩy
      xuống thêm 24px so với thẻ trắng.

      Không dùng `transform: translateY` dù nó cũng giữ nguyên kích thước:
      transform biến khối này thành containing block của mọi con `absolute`,
      một cái bẫy nằm chờ người sau thêm tooltip hay popover vào hero.

      Chỉ áp từ `md`: dưới đó trang cuộn được và cụm đã canh giữa, kéo lên nữa là
      chạm header.
    */
    /*
      `gap-5` (20px) áp cho MỌI khổ, không còn `md:gap-7`.

      Đây là khoảng cách mascot → chữ mà yêu cầu chốt ở 20px. Trên md nó là gap
      DUY NHẤT còn ý nghĩa: hàng liên hệ có `md:mt-auto` nên tự dạt xuống đáy và
      khoảng cách của nó do phần thừa quyết định, không phải do gap.
    */
    <div
      style={{ '--pop-last': 6 } as React.CSSProperties}
      className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center gap-5 pt-2 pb-5 md:-mt-6 md:mb-6 md:min-h-0 md:justify-start md:pt-1 md:pb-6"
    >
      {/*
        Ba khối minh hoạ — mỗi khối pop-in lệch nhau, xem .pop-in trong globals.css.

        Cỡ tính theo CHIỀU CAO chứ không đặt bề rộng: ba ảnh rộng khác nhau
        nhưng cùng cao, ép cùng bề rộng thì đáy các khối pastel sẽ so le.

        TRƯỚC ĐÂY chỗ này là `calc(100vh - 33rem)`, với 33rem là chiều cao ĐO TAY
        của mọi thứ không phải minh hoạ. Hằng số đó đã bị khai tử, vì cỡ chữ câu
        khẩu hiệu tính theo vh: nó không còn là hằng số mà là `K + 26.4vh`, và
        mỗi lần đổi font hay đổi cỡ chữ lại phải đo lại từ đầu (27rem cho Barlow
        cũ, 30rem cho Barlow mới, 33rem cho Roboto Mono).

        Giờ để flexbox tự đo: `md:flex-1` cho hàng minh hoạ ăn đúng phần chiều
        cao còn thừa, câu khẩu hiệu dài ngắn bao nhiêu cũng đúng.
          • md:min-h-0 là BẮT BUỘC — flex item mặc định `min-height: auto` nên
            không chịu co lại, thiếu nó là trang tràn.
          • bề ngang do `panelWidth()` chia, KHÔNG chia ba đều — mỗi ảnh nhận
            phần tỉ lệ thuận với tỉ lệ riêng của nó để cả ba quy về cùng một
            chiều cao. Xem chứng minh ở chỗ khai hàm đó, đầu file.
          • object-contain giữ tỉ lệ khai trong từng file SVG (mảng MASCOTS ở
            đầu file phải khớp `width`/`height` của chúng).
        Dưới md thì chính chốt ngang đó làm bề rộng thật, không còn clamp theo
        vw: dải đó cuộn được nên chiều cao viewport là vô nghĩa, chỉ bề ngang
        mới là thứ phải vừa.
      */}
      {/*
        `items-start`, KHÔNG phải `items-end`.

        Hàng minh hoạ `md:flex-1` ăn hết chiều cao còn thừa, và `md:h-full` cho
        ảnh cao bằng đúng khung đó — nên khi chiều cao là thứ quyết định thì dòng
        này không đổi được gì. Nó có tác dụng ở trường hợp ngược lại: trần ngang
        `md:max-w-[calc((100%-80px)/3)]` chặn trước và chiều cao ảnh tụt xuống
        dưới chiều cao khung. `items-end` dồn toàn bộ phần dư LÊN TRÊN, tức đẩy
        cụm minh hoạ xuống xa header; `items-start` cho nó rơi xuống dưới.

        Với bộ SVG mới (rộng ~1,21 lần chiều cao) thì trường hợp đó KHÔNG còn
        hiếm: từ khoảng 1440px bề cao trở lên, ba ảnh không đủ chỗ nằm ngang
        trước khi kịp cao hết khung, nên trần ngang mới là thứ chặn.

        CẢNH BÁO KHI ĐO LẠI: `.pop-in` mở đầu bằng `scale(0.92) translateY(14px)`
        và fill là `backwards`. Ở môi trường không vẽ khung hình (tab ẩn, trình
        duyệt headless không compositing), animation không bao giờ chạy nên khung
        `from` bị GIỮ NGUYÊN — `getBoundingClientRect()` trả về hộp đã bị co 0,92
        lần và dịch xuống 14px. Đúng cái bẫy đã làm tôi đọc ra "dư 30,8px" trong
        khi bố cục thật dư 0. Muốn số thật thì tắt `.pop-in` trước rồi hãy đo.
      */}
      {/*
        `gap-10` = 40px. Con số này BỊ NHẮC LẠI trong `calc((100%-80px)/3)` ở
        class của từng ảnh (80 = 40 x 2 khoảng cách) — Tailwind không đọc được
        biến TS nên không gộp được thành một chỗ. Đổi khoảng cách thì sửa cả hai.

        `mt-5` = hạ cả cụm xuống 20px, thêm khoảng thở giữa hàng header và khối
        minh hoạ. Là MARGIN chứ không phải `translate-y-5`: transform chỉ dời
        phần vẽ ra mà không dời chỗ chiếm, nên ảnh sẽ thò xuống đè lên câu khẩu
        hiệu bên dưới. Margin đẩy luôn phần còn lại xuống, đúng ý "hạ thấp".
      */}
      {/*
        KHÔNG còn `md:flex-1` — và đây chính là chỗ đã làm chữ bên dưới trôi.

        `flex-1` cho hàng này NUỐT toàn bộ chiều cao thừa của hero. Ba ảnh thì
        cao cố định (bề ngang quyết định, xem panelWidth) và `items-start` ghim
        chúng lên đỉnh, nên phần thừa đọng lại thành một khoảng trống DƯỚI ảnh,
        NGAY BÊN TRONG section này. Khoảng đó co giãn theo độ dài câu pun: đo ở
        1440x900 thì pun 4 dòng cho khoảng cách mascot→chữ là 41,3px, pun 3 dòng
        cho 97,6px. Tức mốc thật nằm ở ĐÁY hero chứ không phải ở đáy mascot.

        Bỏ `flex-1` thì section co đúng bằng ảnh, phần thừa dồn hết xuống hàng
        liên hệ (`md:mt-auto`) — nơi vốn được thiết kế để hứng nó. Khoảng cách
        mascot→chữ thành hằng số, bằng đúng `gap-5` của cột cha.

        `md:min-h-0` bỏ theo: nó tồn tại để cho phép flex item CO lại nhỏ hơn nội
        dung, mà section này không còn co giãn nữa thì cũng không còn gì để co.
      */}
      <section
        aria-hidden="true"
        className="mt-5 flex items-start justify-center gap-10"
      >
        {MASCOTS.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt=""
            width={p.width}
            height={p.height}
            priority
            /*
              CHIA ĐỀU BỀ NGANG, không còn clamp theo vw.

              Bản cũ chặn bằng `clamp(100px,32vw,320px)` cho chiều cao và
              `md:max-w-[30vw]` cho bề ngang — hai con số đo tay theo tỉ lệ
              ~0,9 của bộ webp cũ. Bộ SVG mới rộng ~1,21 lần chiều cao, tức mỗi
              ảnh ăn thêm ~34% bề ngang: giữ nguyên hai số đó là ba ảnh cộng hai
              khoảng cách 40px vượt quá khung và đẩy rộng cả trang, vì flex row
              không xuống dòng.

              BỀ RỘNG QUYẾT ĐỊNH, ở MỌI khổ màn hình — bỏ hẳn `md:h-full`.

              Bản trước để chiều cao ăn theo phần thừa của hero. Với bộ ảnh này
              thì cách đó tự chặn mình ở mức nhỏ: đo tại 1280x720, phần thừa chỉ
              229,8px nên ba ảnh chiếm 912 trên 1192px bề ngang, bỏ trống 280px
              trong khi yêu cầu là phóng TO lên.

              Lấp kín bề ngang thì chiều cao thành hệ quả và tự lớn hơn. `w-` là
              bề rộng THẬT chứ không phải trần, `h-auto` cho tỉ lệ tự lo — xem
              `panelWidth()` ở đầu file để biết vì sao mỗi ảnh một phần khác
              nhau chứ không chia ba đều.
            */
            className="pop-in h-auto object-contain"
            style={
              {
                /* Chỉ số thứ tự, không phải mili giây: chiều ra cần lộn ngược
                   dãy này, mà một con số gõ cứng thì không lộn được. */
                '--pop-i': i,
                /* Không đặt bằng class Tailwind được: mỗi ảnh một hệ số riêng
                   tính từ chính tỉ lệ của nó, mà Tailwind chỉ quét được chuỗi
                   class TĨNH. */
                width: panelWidth(p),
              } as React.CSSProperties
            }
          />
        ))}
      </section>

      {/* Bản đọc cho screen reader — ảnh trên chỉ để trang trí */}
      <p className="sr-only">{ALT.join('. ')}.</p>

      {/* Câu pun + mô tả */}
      {/* Tách hai cột từ xl chứ không phải lg: ở dải 1024–1279 cột trái chỉ được
          ~0,42 bề rộng màn hình, câu khẩu hiệu cỡ mới vỡ thành 5–6 dòng. Xếp
          chồng ở dải đó cho chiều cao gần như y hệt nhưng chữ đọc được. */}
      {/*
        HAI KHỐI ĐỘC LẬP NHAU VỀ CHIỀU DỌC, cả hai treo từ MÉP TRÊN xuống.

        `items-start` (không phải `stretch` mặc định, cũng không phải `center`)
        là thứ giữ điều đó: mỗi ô lưới cao đúng bằng nội dung của nó và dính vào
        cạnh trên của hàng. Câu pun 2 dòng hay 5 dòng thì mô tả bên phải vẫn bắt
        đầu ở đúng một chỗ, và câu pun dài ra thì nó dài XUỐNG DƯỚI chứ không
        đẩy ngược lên trên.

        Cộng với việc hàng minh hoạ đã bỏ `flex-1` (xem ghi chú ở đó), mép trên
        của cả hàng này giờ là hằng số: đúng 20px dưới đáy mascot, ở mọi câu pun.
      */}
      <section className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-14">
        {/* Cỡ chữ vẫn chặn theo chiều cao, cùng lý do với khối ảnh phía trên.
            Bốn con số đều là bản cũ nhân 1,2 (1.7→2.05rem, 4.3→5.2vw, 5→6vh,
            3.4→4.1rem). Ở mọi tỉ lệ màn hình desktop thì 6vh nhỏ hơn 5.2vw nên
            chính vh mới là số quyết định. */}
        <h1 className="text-[clamp(2.05rem,min(5.2vw,6vh),4.1rem)] leading-[1.1] font-bold tracking-[-0.02em]">
          <span className="pop-in block" style={{ '--pop-i': 3 } as React.CSSProperties}>
            {pun.setup}
          </span>
          <span className="pop-in block" style={{ '--pop-i': 4 } as React.CSSProperties}>
            {pun.punchline}
          </span>
        </h1>

        {/* `ch` là bề rộng chữ "0", KHÔNG phải bề rộng trung bình một ký tự — ở
            font tỉ lệ hai số đó khác nhau. Đo trên Helvetica Neue (bảng hmtx):
            ch = 0,556em còn trung bình chữ thường = 0,501em, nên 46ch ở đây là
            ~51 ký tự mỗi dòng — vẫn nằm trong khoảng dễ đọc 45–75. Đổi font thì
            đo lại chứ đừng quy đổi thẳng: cũng 46ch ở Roboto Mono là đúng 46 ký
            tự, còn ở Google Sans Flex là ~65. */}
        {/*
          BỎ `xl:pt-2`. Tám pixel đó là đệm quang học, kéo dòng đầu của mô tả
          xuống cho ngang tầm phần thân chữ của câu pun cỡ lớn bên trái. Yêu cầu
          mới là mô tả cách mascot ĐÚNG 20px, mà 8px đệm thì thành 28px.

          Đánh đổi phải biết: mép trên hai khối giờ thẳng hàng tuyệt đối theo
          hộp chữ, nhưng mắt sẽ đọc ra mô tả cao hơn một chút — chữ h1 cỡ lớn có
          nhiều khoảng trống phía trên nét chữ hơn hẳn chữ 16,5px.
        */}
        <p
          className="pop-in max-w-[46ch] text-[16.5px] leading-[1.75] text-muted-strong"
          style={{ '--pop-i': 5 } as React.CSSProperties}
        >
          Nerdy Hub là kho đề và phòng thi thử trực tuyến cho VSTEP, TOPIK và THPT Quốc gia.
          Làm bài có bấm giờ đúng như thi thật, chấm điểm tự động theo thang riêng của từng kỳ,
          xếp hạng phần trăm so với người khác và chỉ ra dạng câu bạn hay sai. Miễn phí, không
          cần đăng nhập.
        </p>
      </section>

      {/* Liên hệ + nút vào ứng dụng (thay thanh subscribe của bản gốc) */}
      <section
        className="pop-in flex flex-col items-start justify-between gap-6 border-t border-line pt-6 sm:flex-row sm:items-center md:mt-auto"
        style={{ '--pop-i': 6 } as React.CSSProperties}
      >
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt className="text-[13.5px] tracking-[0.06em] text-muted uppercase">Gmail</dt>
            <dd className="mt-1">
              <a
                href="mailto:ngminhquan2117@gmail.com"
                className="text-[16px] font-semibold hover:underline"
              >
                ngminhquan2117@gmail.com
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[13.5px] tracking-[0.06em] text-muted uppercase">Facebook</dt>
            <dd className="mt-1 text-[16px] font-semibold">NERDY HUB</dd>
          </div>
        </dl>

        <EnterButton />
      </section>
    </div>
  )
}
