import type { Metadata } from 'next'
import Image from 'next/image'
import { EnterButton } from '@/components/landing/enter-button'
import { punOfTheDay } from '@/lib/puns'
import panels from '@/public/hero/panels.json'

export const metadata: Metadata = {
  title: 'Kho đề & thi thử online có bấm giờ — VSTEP, TOPIK, THPT Quốc gia',
  description:
    'Làm đề thi thử online có bấm giờ như phòng thi thật. Chấm điểm tự động, so sánh với người khác, phân tích điểm yếu. Miễn phí, không cần đăng nhập.',
  alternates: { canonical: '/' },
}

/**
 * ISR 1 giờ. Trang phải tĩnh cho SEO, nhưng câu pun đổi theo ngày nên bản dựng
 * sẵn không được giữ mãi.
 */
export const revalidate = 3600

const ALT = [
  'Thầy giáo giảng bài toán trước bảng',
  'Bạn nữ đọc sách tiếng Anh',
  'Bạn nữ học tiếng Hàn trên máy tính bảng',
]

export default function LandingPage() {
  const pun = punOfTheDay()

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

      Cặp lề âm/dương là bắt buộc đi cùng nhau. Khối này là `flex-1` trong một
      cột flex, nên nếu chỉ đặt lề âm thì phần chiều cao khả dụng TĂNG thêm 24px
      và hàng minh hoạ (cũng `flex-1`) sẽ nở ra chừng đó — tức ảnh to lên, đúng
      cái không được phép đổi. Lề dương bù lại cho tổng chỗ chiếm bằng 0, khối
      chỉ dịch lên chứ không giãn.

      Không dùng `transform: translateY` dù nó cũng giữ nguyên kích thước:
      transform biến khối này thành containing block của mọi con `absolute`,
      một cái bẫy nằm chờ người sau thêm tooltip hay popover vào hero.

      Chỉ áp từ `md`: dưới đó trang cuộn được và cụm đã canh giữa, kéo lên nữa là
      chạm header.
    */
    <div
      style={{ '--pop-last': 6 } as React.CSSProperties}
      className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center gap-5 pt-2 pb-5 md:-mt-6 md:mb-6 md:min-h-0 md:justify-start md:gap-7 md:pt-1 md:pb-6"
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
          • md:max-w-[30vw] giữ nguyên chốt chặn NGANG: mỗi ảnh rộng ~0,9 lần
            chiều cao, ba ảnh kể cả khoảng cách là ~81vw.
          • object-contain giữ tỉ lệ gốc trong public/hero/panels.json.
        Dưới md giữ clamp thuần: dải đó min-h-screen và cuộn là bình thường, trừ
        chiều cao viewport ở đó là vô nghĩa.
      */}
      {/*
        `items-start`, KHÔNG phải `items-end`.

        Hàng minh hoạ `md:flex-1` ăn hết chiều cao còn thừa, và `md:h-full` cho
        ảnh cao bằng đúng khung đó — nên THƯỜNG không dư gì cả và dòng này không
        đổi được gì. Nó chỉ có tác dụng ở đúng một trường hợp: cửa sổ cao và hẹp,
        lúc đó `md:max-w-[30vw]` chặn bề ngang lại và chiều cao ảnh tụt xuống
        dưới chiều cao khung. `items-end` dồn toàn bộ phần dư LÊN TRÊN, tức đẩy
        cụm minh hoạ xuống xa header; `items-start` cho nó rơi xuống dưới.

        CẢNH BÁO KHI ĐO LẠI: `.pop-in` mở đầu bằng `scale(0.92) translateY(14px)`
        và fill là `backwards`. Ở môi trường không vẽ khung hình (tab ẩn, trình
        duyệt headless không compositing), animation không bao giờ chạy nên khung
        `from` bị GIỮ NGUYÊN — `getBoundingClientRect()` trả về hộp đã bị co 0,92
        lần và dịch xuống 14px. Đúng cái bẫy đã làm tôi đọc ra "dư 30,8px" trong
        khi bố cục thật dư 0. Muốn số thật thì tắt `.pop-in` trước rồi hãy đo.
      */}
      <section
        aria-hidden="true"
        className="flex items-start justify-center gap-3 md:min-h-0 md:flex-1 md:gap-6"
      >
        {panels.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt=""
            width={p.width}
            height={p.height}
            priority
            /*
              Dưới md: 32vw. Ba ảnh đứng cạnh nhau rộng tổng cộng ~2,7 lần chiều
              cao (tỉ lệ mỗi ảnh ~0,89–0,92) cộng hai khoảng cách, nên 32vw là
              ~86vw + 24px — vừa đủ không tràn ngang ở mọi bề rộng máy. SÀN phải
              thấp (100px): đặt sàn 150px thì ở màn 375px ba ảnh chiếm 428px và
              đẩy rộng cả trang, vì flex không xuống dòng.
            */
            className="pop-in h-[clamp(100px,32vw,320px)] w-auto object-contain md:h-full md:max-h-[560px] md:max-w-[30vw]"
            /* Chỉ số thứ tự, không phải mili giây: chiều ra cần lộn ngược dãy
               này, mà một con số gõ cứng thì không lộn được. */
            style={{ '--pop-i': i } as React.CSSProperties}
          />
        ))}
      </section>

      {/* Bản đọc cho screen reader — ảnh trên chỉ để trang trí */}
      <p className="sr-only">{ALT.join('. ')}.</p>

      {/* Slogan + mô tả */}
      {/* Tách hai cột từ xl chứ không phải lg: ở dải 1024–1279 cột trái chỉ được
          ~0,42 bề rộng màn hình, câu khẩu hiệu cỡ mới vỡ thành 5–6 dòng. Xếp
          chồng ở dải đó cho chiều cao gần như y hệt nhưng chữ đọc được. */}
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
        <p
          className="pop-in max-w-[46ch] text-[16.5px] leading-[1.75] text-muted-strong xl:pt-2"
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
