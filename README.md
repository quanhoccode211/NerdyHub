# Nerdy Hub — Kho đề & Thi thử Trực tuyến

Bản dựng theo `SPEC.md`. Giao diện lấy theo bản dựng Dribbble "Online Learning Dashboard"
(file tham chiếu: `../index.html`).

Đã có **F1 → F6**: kho đề → phòng thi → chấm điểm → kết quả & thống kê → kế hoạch ôn
+ Google Calendar → Auth.js, xác minh tuổi và quyền dữ liệu theo NĐ 13/2023.
**F8 (Admin CMS) chưa làm** — xem [Chưa có trong đợt này](#chưa-có-trong-đợt-này).

---

## Chạy thử

```bash
npm install
```

```bash
npm run setup
```

```bash
npm run dev
```

Mở http://localhost:3000. Không cần đăng nhập để làm bài.

`npm run setup` chạy migration, nạp dữ liệu mẫu và sinh file audio placeholder.

---

## Khác biệt so với SPEC (có chủ ý)

| SPEC | Thực tế | Lý do |
|---|---|---|
| PostgreSQL 16 | **SQLite** | Máy dev không có Postgres/Docker. Xem [Đổi sang PostgreSQL](#đổi-sang-postgresql). |
| Prisma 5 | **Prisma 7.9** | Bản hiện hành. Connection nằm ở `prisma.config.ts` + driver adapter, không còn `url` trong schema. |
| Next.js 15 | **Next.js 16.3** | Bản hiện hành từ `create-next-app`. `params`/`searchParams` là Promise, Turbopack mặc định. |
| Redis (percentile, rate limit) | **SQL + in-memory** | Không có Redis. Cùng chữ ký hàm để thay thế sau — xem `lib/rate-limit.ts`, `updatePercentile()`. |
| Recharts | **SVG tự vẽ** | Biểu đồ đều tĩnh; phong cách thiết kế gốc rất riêng, dựng thẳng nhanh hơn và không gánh thêm JS. |

### Ba chỗ SQLite ép phải đổi schema

1. **Không có `enum`** → dùng `String`, union type ở `lib/enums.ts`, Zod validate ở biên API.
2. **Không có scalar list** → `String[]`/`Int[]` lưu JSON string, hậu tố `...Json`, đọc/ghi qua `lib/json-fields.ts`.
3. **Không có `@db.Text`** → bỏ (TEXT là mặc định).

### Đổi sang PostgreSQL

1. `prisma/schema.prisma`: đổi `provider = "postgresql"`, hoàn nguyên 3 điểm trên.
2. `lib/db.ts`: đổi adapter sang `@prisma/adapter-pg`.
3. `.env`: trỏ `DATABASE_URL` tới Postgres.
4. Bỏ `lib/json-fields.ts`, dùng mảng trực tiếp.

Quan hệ giữa các bảng không phải sửa gì.

---

## Kiến trúc

```
app/
  (marketing)/     Trang công khai, SSR/ISR, có JSON-LD  — F1, F7
  (app)/           Sau đăng nhập: kết quả, thống kê, cài đặt (dùng AppShell)
  (exam)/thi/      PHÒNG THI — cố ý KHÔNG có rail điều hướng
  api/attempts/    Tạo / khôi phục / đồng bộ / nộp bài
lib/
  content-filter   ⭐ Chốt chặn canPublish — mọi truy vấn public phải đi qua
  exam-clock       GRACE_SEC + overdueSeconds — thuần, dùng chung cho sync/chấm/phòng thi
  scoring/         Strategy theo từng kỳ thi + engine chấm dùng chung
  attempt-service  Nạp nội dung đề, lọc đáp án khi bài chưa nộp
  auth/            Session, tuổi, consent, quyền dữ liệu (NĐ 13)
  calendar/google  freeBusy mọi lịch đang bật + dựng lưới tuần
  queries          Truy vấn nội dung công khai (đã áp content filter)
components/
  exam-room/       Store, sync 3 lớp, highlight engine, timer, review
  calendar/        Lưới tuần bận/rảnh
  shell/use-modal  Bẫy focus + Escape + khoá cuộn, dùng chung mọi hộp thoại
  shell/nav-slide  Hiệu ứng chuyển trang — xem mục riêng bên dưới
  game/            Tầng game của khu Tiện ích (client thuần)
```

## Lịch ôn (F5)

`/lich-on` vẽ **lưới tuần kiểu Google Calendar**: cột là ngày, trục dọc là giờ, khối
đặc là khoảng bận (`#FF746C`) và khoảng ôn được (`#93C572`).

- **Đọc MỌI lịch đang bật**, không chỉ `primary`. Lịch học, lịch thi, lịch được chia sẻ
  thường nằm ở lịch phụ; hỏi mỗi `primary` là báo cả tuần rảnh trong khi thực tế kín —
  sai theo hướng nguy hiểm nhất vì nó gợi ý đúng vào giờ đang học.
- **Chừa 10 phút** (`WINDOW.bufferMinutes`) trước và sau mỗi khoảng bận. Không ai rời
  bàn học đúng giây tiết sau bắt đầu; khe dán sát lịch bận là khe trên giấy.
- Vị trí khối tính sẵn ở **server** dưới dạng phút, view chỉ quy ra phần trăm — server
  và trình duyệt lệch múi giờ thì khối sẽ vẽ lệch với chính con số giờ in cạnh nó.
- Chỉ xin `calendar.readonly`. `freeBusy` không trả tiêu đề, mô tả hay người tham dự.
- **Chỉ phần gọi Google nằm trong `<Suspense>`**, không phải cả trang. Kiểm cấu hình,
  kiểm đăng nhập và đọc kết nối trong DB đều là truy vấn cục bộ vài mili giây — kéo
  chúng vào trong khung xương chỉ làm trang nháy thêm một nhịp vô nghĩa. Ranh giới đặt
  thấp, ngay trên `getBusySlots`.
- **Khung xương cao đúng bằng lưới thật** (`(dayEnd - dayStart) * 44px`). Thấp hơn thì
  lúc dữ liệu về cả trang giật nảy xuống — đổi một cú khựng lấy một cú nhảy thì không
  lời gì.
- **Không cache kết quả `freeBusy`.** `dynamic = 'force-dynamic'` là chủ ý: hiện một
  tuần bận cũ sai theo đúng hướng nguy hiểm nhất, vì nó gợi ý ôn vào giờ đang có việc.

### Hai bất biến quan trọng nhất

**1. Không lộ nội dung không được phép.** `provenance.canPublish = false` chặn ở mọi lối
ra, kể cả khi `status = PUBLISHED`. Seed cố tình có một đề như vậy để kiểm chứng:

```bash
npm run check:content-filter
```

Kiểm tra 4 lối vào: trang chi tiết, gọi thẳng `POST /api/attempts`, sitemap, danh sách đề.

Cùng tinh thần đó, các bất biến của luồng chấm điểm được khẳng định bằng:

```bash
npm run check:exam-flow
```

9 khẳng định, dựng thẳng trong DB rồi tự dọn: câu gắn cờ mà bỏ trống phải vào nhóm
"Bỏ trống" chứ không phải "Sai"; `correct + wrong + unanswered` phải bằng số câu chấm
được; ESSAY bỏ trống vẫn được đếm dù không có dòng answer nào; `timeSpent` có trần;
lượt thi quá hạn bị đóng và đánh dấu `autoSubmitted`. Xem
[docs/kiem-tra-phong-thi.md](docs/kiem-tra-phong-thi.md) để biết mỗi khẳng định
tương ứng với lỗi nào.

**2. Không lộ đáp án khi đang làm bài.** `loadExamRoom()` chỉ đính `isCorrect` /
`explanation` / `transcript` khi attempt **thực sự** đã `SUBMITTED` — tham số `revealAnswers`
truyền vào không đủ để mở khoá.

---

## Phòng thi (F2)

- **Đồng hồ tính ở server, và server CƯỠNG CHẾ hạn chót.** `expiresAt` lưu trong DB
  đúng bằng thời lượng đề, không cộng đệm; client đếm bằng `performance.now()` (đồng hồ
  đơn điệu) nên đổi giờ hệ thống không kéo dài được thời gian. Quan trọng hơn: `/sync`
  phát hiện quá hạn thì tự chấm bài ngay trong request đó và trả 409 cho mọi lần gọi
  sau — đồng hồ client sai, tab treo ở debugger hay gọi thẳng API bằng curl đều không
  ghi thêm được đáp án. Dung sai 30 giây (`GRACE_SEC` ở `lib/exam-clock.ts`) chỉ để hấp
  thụ độ trễ mạng, không phải thời gian tặng thêm.
- **Audio "nghe một lần" là trạng thái của SERVER.** Cột `audioPlayedSectionIdsJson`
  trên `Attempt`, hợp nhất chứ không ghi đè khi sync. Tải lại trang không đưa nút "Bắt
  đầu nghe" quay lại.
- **Chống mất bài 3 lớp.** Ghi `sessionStorage` tức thì → debounce 3s POST batch →
  khôi phục từ server khi vào lại, hợp nhất với bản nháp cục bộ. Mất mạng thì batch nằm
  lại hàng đợi và tự gửi khi có `online`.
- **Audio `ONCE_NO_SEEK`.** Không render thanh tua, và mọi sự kiện `seeking` bị hoàn tác
  về mốc đang phát — bấm phím tắt hay gọi từ console cũng không tua được.
- **Highlight neo theo offset ký tự** trên `textContent`, không theo cấu trúc DOM, nên
  vẫn đúng vị trí sau khi thẻ `<mark>` được chèn/gỡ, sau reload và sau khi nộp.
- **Bốn trạng thái câu hỏi phân biệt bằng cả màu lẫn hình dạng** (nền đặc / viền / icon cờ
  / ring), không chỉ bằng màu.

---

## Hiệu ứng chuyển trang

Đổi tab, và bước từ trang giới thiệu vào ứng dụng, đều có một cú trượt ngang: vùng nội
dung lùi sang trái rồi trang mới trôi vào từ phải, còn ô đen đánh dấu tab chạy sang vị
trí mới. Code ở `components/shell/nav-slide.tsx` + khối `ĐỔI TRANG` trong `globals.css`.

**Dùng thẳng View Transitions API của trình duyệt, KHÔNG dùng `<ViewTransition>` của
React.** React ghép cặp cũ/mới theo **vị trí trong cây component**, mà cây ở đây đứt ở
mọi ranh giới route group: `(landing)`, `(marketing)` và `(app)` mỗi nhóm dựng layout
riêng — kể cả `(marketing)` và `(app)` tuy cùng dựng `AppShell` nhưng là hai instance
khác nhau. Đi qua ranh giới nào là React thấy một cây biến mất và một cây khác hiện ra,
không có cặp nào để nội suy, và nó bỏ qua luôn. Đã đo bằng cách vá
`document.startViewTransition` rồi đếm số lần gọi: đổi tab trong `(app)` cho 1, còn
landing → dashboard cho **0**, kể cả khi trang đích đã nằm sẵn trong cache của router.
Trình duyệt thì ghép cặp theo `view-transition-name` — một chuỗi CSS — nên hai thẻ
`<main>` ở hai layout chẳng dính dáng gì nhau vẫn nối được vào nhau.

### Cạm bẫy lớn nhất: cái gì không có tên thì bị ĐÓNG BĂNG

Trong lúc transition chạy, mọi phần tử **không** mang `view-transition-name` đều bị gom
vào nhóm `root` — một ảnh chụp **tĩnh** của trang cũ, cross-fade sang ảnh mới. Nghĩa là
**mọi `transition` CSS đặt trên DOM thật của những phần tử đó không được vẽ ra lấy một
khung hình.**

Đây là thứ đã ngốn bốn vòng chỉnh tay. Icon ở tab vừa chọn giữ nguyên màu tối trong khi
ô đen đã phủ lên, tức nó biến mất hơn 300ms; mọi lần chỉnh `transition-delay` đều không
đổi được gì, vì thứ đang hiển thị là ảnh cũ chứ không phải DOM. Cách chữa là **đặt tên
cho hàng tab** rồi tắt animation của nó (`::view-transition-old(nav-rail) {display:none}`
+ `new {animation:none}`) — có tên thì nó thoát khỏi ảnh `root`, và `::view-transition-new`
là bản vẽ **sống** nên transition trên DOM thật mới chạy được.

Triệu chứng để nhận ra lần sau: **một thứ lẽ ra phải đổi lại đứng im đúng bằng thời
lượng transition**, và chỉnh timing kiểu gì cũng không nhúc nhích.

### Ba luật còn lại

**Tên phải DUY NHẤT trong một trang.** Chỉ pill đang mở mới mang `nav-active-pill`; gắn
cho cả sáu là trình duyệt bỏ qua cả nhóm và không có gì chạy.

**Mọi rule vẫn khoanh trong `:active-view-transition-type(slide-*)`, nhưng lý do gốc đã
mất.** Việc khoanh sinh ra vì trang từng có một view transition thứ hai — nút sáng/tối —
và lần chuyển đó không mang type nào, nên rule không khoanh sẽ đè vào nó. Dark mode đã bị
bỏ khỏi sản phẩm nên hiện chỉ còn đúng một loại transition. Giữ nguyên việc khoanh: nó
không tốn gì, và thêm một type mới sau này là an toàn ngay. Nhưng đừng dựa vào ghi chú cũ
để suy ra rằng "còn một transition khác đang chạy" — không còn.

**Thời lượng ô đen và thời lượng đổi màu icon là MỘT cặp biến** — `--nav-pill-travel` /
`--nav-pill-ease`, và `--nav-pill-ink` tính bằng `calc()` từ cái đầu — chứ không phải hai
con số gõ ở hai chỗ.

Nhưng hai con số **không bằng nhau**, và đây là chỗ dễ sửa sai nhất: mốc của icon là lúc
ô đen **phủ tới** nó, không phải lúc ô đen dừng. Ô đen rộng đúng bằng một pill, nên mép
trước của nó chạm tâm icon đích ở quãng `1 − W/(2D)` của đường đi — với hai tab liền nhau
là ngay giữa đường. Cho icon trắng hẳn ở mốc 100% nghĩa là suốt nửa sau của chuyển động
icon mới trắng một nửa (≈`#afb5c0`) trong khi nền dưới nó đã đen đặc: đọc ra đúng là
"icon sáng chậm hơn ô đen".

**Thứ phải cắt ngắn là QUÃNG XÁM NHẠT, không phải tổng thời lượng.** Mọi phép nội suy xám
đậm → trắng đều đi qua xám nhạt ở giữa, mà xám nhạt tương phản kém với *cả hai* nền nó
nằm trên: nền rail sáng lúc ô đen chưa tới, và nền đen đặc lúc ô đen vừa phủ lên. Icon
không hề bị ẩn — mỗi pill chỉ có **một** thẻ `<svg>`, `opacity` luôn `1`, ô đen là `<span>`
rỗng ruột nằm *sau* icon — nhưng ở quãng đó nó nhạt gần bằng nền, nên đọc ra là "icon biến
mất rồi hiện lại thành cái trắng". Rút tổng thời lượng chỉ **dời** quãng xám chứ không xoá.

Nên chia làm ba phần, mỗi phần ¼ quãng bay của ô đen:

| | |
|---|---|
| `--nav-pill-ink-hold` | 90ms — **giữ** nguyên màu tối, chờ ô đen bay tới |
| `--nav-pill-ink` | 90ms — quãng đổi màu, tức quãng xám nhạt |
| đích | 180ms = 50% quãng bay, đúng lúc mép ô đen chạm tâm icon |

`--nav-pill-ink-ease` là `cubic-bezier(0.7, 0, 0.3, 1)` — **dốc ở giữa**, nán lại ở hai
đầu (tối, rồi trắng) và lao qua khoảng giữa. Đây là chỗ **duy nhất** được phép lệch easing
với ô đen, vì icon không còn "đi song song" với nó mà là một cú lật đúng lúc nó tới. Tính
ra, khoảng icon nằm trong vùng xám 25–75% chỉ còn ~16ms (một khung hình ở 60fps), so với
~40ms khi cho nó chạy suốt 180ms bằng đường cong chung.

Đánh đổi có chủ ý: nhảy từ tab đầu sang tab cuối thì icon trắng xong trước lúc ô đen tới,
và trắng trên nền rail sáng thì mờ đi một nhịp. Nhảy một hai tab là chuyện thường xuyên,
nhảy hết rail là ngoại lệ — và "mờ một nhịp trên nền sáng" nhẹ hơn "đen trên đen" ngay
giữa cú chuyển động mắt đang nhìn.

**Đổi màu icon phải là `animation`, không thể chỉ là `transition`.** Transition chỉ chạy
khi phần tử có sẵn một giá trị cũ để đi từ đó, mà rail bị **dựng lại từ đầu** mỗi lần đi
qua ranh giới route group: `/de-thi` nằm ở `(marketing)`, năm tab còn lại ở `(app)`, nên
mọi lần vào hay ra khỏi Kho đề đều cho ra sáu thẻ pill hoàn toàn mới (đo bằng cách đánh
dấu từng DOM node rồi bấm — trong `(app)` node giữ nguyên, qua `(marketing)` thì mới hết).
Phần tử mới toanh thì icon bật trắng ngay khung hình đầu, trắng trên nền rail sáng, tức
mất hút cho tới lúc ô đen bay tới. `@keyframes nav-icon-ink` phủ cả hai trường hợp bằng
một nhịp; transition ở `.nav-pill[data-active='true']` giữ lại làm đường lui cho trình
duyệt không hỗ trợ View Transitions.

`animation-fill-mode` phải là **`both`**, không phải `forwards`: phần `backwards` mới là
thứ giữ màu tối trong 90ms `hold`. Thiếu nó thì ở trường hợp rail vừa dựng lại, màu tĩnh
của phần tử là trắng, và icon sẽ trắng ngay từ đầu quãng chờ — đúng cái bệnh vừa chữa.

### Bước từ trang giới thiệu vào ứng dụng KHÔNG trượt

Đổi tab thì trượt. Còn `ENTER_APP` — chặng từ trang giới thiệu vào Tổng quan — chạy bằng
cơ chế khác hẳn: các element của trang giới thiệu **rút đi lần lượt**, rồi các khối của
trang đích **nảy lên lần lượt**.

**Lý do không lồng được vào view transition:** trong lúc transition chạy, trang cũ chỉ là
một **ảnh chụp tĩnh** — không có element riêng lẻ nào để mà cho biến mất lần lượt. Đây
đúng là cạm bẫy "cái gì không có tên thì bị đóng băng" ở trên, nhìn từ một hướng khác.
Nên hiệu ứng thoát phải chạy **trước** khi điều hướng, trên DOM thật, và chặng này không
gọi `startViewTransition` lấy một lần.

Ba nhịp:

1. Bấm nút → gắn `.pop-leaving` lên `<html>`. CSS chạy `pop-in` với `reverse`, và thứ tự
   cũng lộn: `--pop-last − --pop-i`. Thứ hiện ra sau cùng là thứ biến mất đầu tiên.
2. Chờ hết dãy (`POP_OUT_MS` = 630ms) rồi `router.push`. Không trượt: trang cũ lúc này
   đã trống, trượt thêm một nhịp là thừa.
3. AppShell thấy cờ `enteringApp` thì gắn `.enter-stagger` lên `<main>`, các thẻ nảy lên
   theo chỉ số ghép từ hai cấp (`--pop-row` của hàng, `--pop-col` của thẻ), rồi **tự gỡ
   sau 900ms**.

**Ba chỗ dễ làm hỏng:**

- **Chiều ra phải là KEYFRAME KHÁC TÊN (`pop-out`), không phải `pop-in` +
  `direction: reverse`.** Đây là lỗi đã làm hiệu ứng thoát không chạy một khung hình nào —
  cả trang tắt phụt. Animation chỉ khởi động lại khi `animation-name` **đổi**; đổi mỗi
  duration/direction/fill thì trình duyệt coi là vẫn animation cũ và chỉ cập nhật tham số.
  Mà `pop-in` đã chạy xong từ lúc tải trang nên nó đang ở *after phase*; gắn thêm
  `reverse` + `forwards` vào đó là trình duyệt vẽ ngay khung cuối của chiều ngược, tức
  khung `from` của `pop-in`: `opacity: 0`. **Triệu chứng để nhận ra lần sau: hiệu ứng
  không chạy mà nhảy thẳng tới trạng thái cuối, và chỉnh timing kiểu gì cũng không đổi.**
- **`--pop-i` là CHỈ SỐ, không phải mili giây.** Trước đây mỗi element gõ
  `animationDelay: '360ms'`. Đủ dùng cho một chiều, nhưng chiều ngược cần đúng dãy đó lộn
  lại — mà một con số gõ cứng thì không lộn được. Thêm/bớt element có `--pop-i` thì phải
  sửa `--pop-last` trên thẻ bọc của `(landing)/page.tsx`.
- **Chiều ra dùng `forwards`, KHÔNG dùng `both`.** Trong lúc chờ tới lượt, element phải
  còn nguyên trên màn hình; `both` fill ngược và giấu nó ngay từ đầu, thành ra cả trang
  biến mất cùng lúc — mất sạch phần lần lượt.
- **`.enter-stagger` BẮT BUỘC phải tự gỡ.** AppShell không unmount khi đổi tab giữa các
  trang chức năng, nên class còn lại là mọi lần đổi tab sau đó cũng nảy một loạt thẻ,
  tức đổi luôn hiệu ứng trượt vốn phải giữ nguyên. Cùng lý do, `.enter-stagger` chỉ nhắm
  **từng thẻ** (`> header`, `> div > *`) chứ không nhắm cả hàng: hàng mờ dần trong khi
  thẻ bên trong cũng mờ dần là hai lớp opacity chồng nhau.

Cờ `enteringApp` là **biến cấp module**, không phải `sessionStorage`: nó chỉ cần sống qua
đúng một lần điều hướng phía client, mà lần đó không nạp lại JS nên biến còn nguyên.
`sessionStorage` thì sống qua cả F5 và sẽ bắn hiệu ứng vào một lần tải trang chẳng liên
quan. AppShell đọc cờ **lúc render** chứ không phải trong effect — chờ tới effect thì các
thẻ đã kịp vẽ ra đầy đủ một nhịp rồi mới nhảy về trong suốt, thành một cú nháy.

### Bốn thứ ở header phải ĐỨNG YÊN, và cách làm giống hệt nhau

Con dấu, hàng tab, ô đen đánh dấu tab, và **cụm nút bên phải** (chuông, tài khoản) đều
không được trôi theo cú trượt. Cả bốn dùng chung một công thức: đặt `view-transition-name`
để thoát khỏi ảnh chụp `root`, rồi `display: none` cho ảnh cũ + `animation: none` cho ảnh
mới.

Cụm nút bên phải mang tên `header-actions`. Chúng giống hệt nhau ở mọi trang chức năng nên
không có gì để chuyển tiếp; nằm trong ảnh `root` thì chúng bị cross-fade cùng cả trang và
mắt đọc ra là chúng cũng đang "đổi trang".

⚠️ **Cụm đó BẮT BUỘC phải kèm `relative z-50`, và đây là hệ quả trực tiếp của việc đặt
tên.** `view-transition-name` biến phần tử thành một **stacking context**. Menu tài khoản
bên trong là `absolute z-50`, nhưng từ đó z-index của nó chỉ còn tranh chấp *bên trong*
cụm; ra ngoài, cả cụm tham gia thứ tự vẽ với `z-index: auto`, mà `<main>` nằm sau trong
DOM nên các thẻ nội dung phủ lên trên menu. Triệu chứng: menu tài khoản bị thẻ "Giờ luyện
tập" cắt ngang.

Cách chữa là nâng z-index của **chính cụm**, không phải của menu — menu có tăng bao nhiêu
cũng không thoát được stacking context của cha. Đã kiểm bằng `elementFromPoint` tại điểm
chồng lấn: có `relative z-50` thì hit trả về menu, bỏ hai class đó thì hit trả về thẻ nội
dung.

**Bài học tổng quát:** mỗi lần thêm `view-transition-name` cho một phần tử có con
`absolute` nổi lên trên (menu, tooltip, popover), phải kiểm lại z-index của chính phần tử
đó. Đây là tác dụng phụ dễ quên nhất của thuộc tính này.

### Vài chi tiết nhỏ nhưng cố ý

- **Thẻ trắng, rail điều hướng và con dấu đứng yên**, chỉ vùng nội dung trượt. Khung mà
  trôi theo thì hiệu ứng đọc ra như bị đẩy cả cửa sổ chứ không phải đổi nội dung.
- **Hướng trượt đọc từ thứ tự tab trên rail**, không phải từ lịch sử duyệt. Các tab là
  mục ngang hàng; cho cái nào cũng trượt cùng một chiều thì chuyển động hoặc vô nghĩa,
  hoặc nói sai — mắt đọc "đi tiếp" trong khi người dùng vừa quay lại chỗ cũ.
- **Tab đang mở KHÔNG phải link — nó là `<span>`.** Bấm lại chính tab đang đứng sẽ chạy
  lại nguyên bộ hiệu ứng: ô đen bay từ pill đó về đúng pill đó, icon đổi màu một vòng,
  nội dung trượt ra rồi trượt vào cùng một trang — một chuyển động không nói lên điều gì,
  và người dùng đọc ra là giao diện bị nháy. Bỏ hẳn thẻ `<a>` chứ không chỉ chặn
  `onClick`: chặn `onClick` vẫn còn chuột giữa, Ctrl+click, Enter khi focus bằng bàn phím
  và menu chuột phải. `aria-current="page"` là cách chuẩn để báo "bạn đang ở đây" mà
  không cần link.
- **Hàng tab không cuộn ngang.** Từng có `overflow-x-auto` + `no-scrollbar` phòng màn hình
  hẹp; bỏ rồi. Sáu icon là mốc điều hướng luôn phải thấy hết, mà thanh cuộn thì giấu bớt
  tab đi và không để lại dấu hiệu nào cho biết còn tab ở ngoài rìa. `min-w-0` cũng bỏ
  theo — chính nó cho phép hàng tab co nhỏ hơn nội dung, tức là điều kiện sinh ra cuộn.
- **Ảnh chụp vùng nội dung giữ tỉ lệ gốc** (`object-fit: none`). Mặc định trình duyệt
  nắn ảnh cũ cho vừa khung mới, và chữ bị kéo giãn méo mó giữa hiệu ứng.
- `SlideLink` vẫn là `<a href>` thật: chuột giữa, Ctrl+click và bộ thu thập của công cụ
  tìm kiếm không đổi gì. `router.push` trả về ngay chứ không chờ route render, nên
  callback chỉ được thả khi `usePathname()` đổi — kèm trần 1200ms để một route lỗi không
  bỏ lớp phủ nằm đè vĩnh viễn.
- `next dev` **tắt prefetch**, nên đo tốc độ chuyển tab ở môi trường dev luôn ra chậm
  hơn thực tế. Đo trên bản build production.

---

## Chữ

Cả web chạy **một font duy nhất: Helvetica Neue bản việt hoá**, tự host qua `next/font/local`
từ `app/fonts/`. Bản trước chạy hai font (Roboto Mono cho giao diện + Google Sans Flex cho
`<p>`/`<li>`); lý do tách là Roboto Mono đều chiều rộng, đọc đoạn dài mỏi mắt — Helvetica
Neue là font tỉ lệ nên lý do đó không còn, và token `--font-prose` cùng rule `p, li` đã bỏ.

**Đo cmap trước khi tin vào tên file.** Ràng buộc cũ giữ nguyên: font phải phủ
U+1EA0–U+1EF9, chỗ chứa nguyên âm hai dấu chồng nhau (`ế ệ ộ ợ ữ`). Ba file đang dùng đều
phủ **90/90**. Đợt trước có một bộ "Helvetica" gửi kèm ba file Light / Compressed / Rounded
chỉ 227 glyph và **0/90** dấu tiếng Việt — tên file không nói gì cả, phải đọc bảng cmap.

### Thang độ đậm: 4 nấc Tailwind ↔ 3 file

| Tailwind | `@theme` khai | File |
|---|---|---|
| `font-normal` | 400 | `HelveticaNeue.otf` |
| `font-medium` | 500 | `HelveticaNeue-Medium.otf` |
| `font-semibold` | **700** | `HelveticaNeue-Bold.otf` |
| `font-bold` | 700 | `HelveticaNeue-Bold.otf` |

`semibold` **gộp vào** `bold` vì Helvetica Neue vốn không có Semibold — thang của nó là
UltraLight / Light / Roman / Medium / Bold. Đây là nấc duy nhất bị gộp, và nó được **khai
thẳng trong `@theme`** chứ không để trình duyệt tự lùi: không khai thì nó vẫn lùi, nhưng
lặng lẽ và theo hai chiều khác nhau — nấc 300 lùi *xuống* 400, nấc 600 nhảy *lên* 700. Ba
rule CSS thô từng gõ `font-weight: 600` (`.btn-primary`, `.btn-secondary`, `.passage-body h3`)
đã sửa thành 700 vì `@theme` không với tới chúng.

Muốn thử hướng ngược lại — tiêu đề nhỏ và nút chính nhẹ đi, kiểu Neue cổ điển — thì đổi
`--font-weight-semibold` thành `500`, một dòng, không phải sửa 54 chỗ trong TSX.

### Siết chữ ở cỡ lớn

Helvetica được vẽ cho chữ chì xếp sát, nên trên màn hình nó **lỏng ở cỡ lớn và bí ở cỡ
nhỏ**. `@layer base` siết theo từng cấp tiêu đề (h1 −0.022em → h4 −0.006em), và
`--tracking-wide` được nâng từ 0.025em lên **0.06em** cho nhãn HOA — chữ hoa Helvetica
không có phần nhô lên nhô xuống để mắt bám, để nguyên mặc định thì cả nhãn đọc ra như một
khối liền. **Chữ chạy giữ nguyên 0**: ở 14–17px siết thêm là dấu tiếng Việt bắt đầu chạm
nhau giữa hai chữ.

### Ba chi tiết đã đo, đừng đoán lại

- **Chữ số vẫn tabular**: 556/1000 ở cả ba cân nặng, và giống nhau giữa các cân nặng — nên
  đồng hồ phòng thi, `tabular-nums` và bảng số liệu không nhảy cột, kể cả khi số đổi sang đậm.
- **`declarations` ép chung một hộp dòng.** `hhea` của Regular là 952/−213/28 còn Medium và
  Bold là 975/−217/29, lệch 2,3%. Không ép thì một chữ `<strong>` giữa đoạn văn nống riêng
  dòng đó cao lên, và cả đoạn có một dòng thưa hơn những dòng khác.
- **Đừng nối thêm font dự phòng vào `--font-sans`.** `--font-app` do next/font sinh ra đã là
  cả một danh sách (face thật → face `Fallback` dựng từ `local(Arial)` có `size-adjust` →
  Arial → sans-serif). Nối thêm là lặp lại y hệt lần hai.

### Cờ quốc gia phải TỰ HOST, không dựa vào font hệ thống

Cờ trong emoji là hai *regional indicator* ghép lại (🇬 + 🇧 = 🇬🇧). **Segoe UI Emoji của
Windows cố ý không chứa glyph cờ**, nên không font nào vẽ được và trình duyệt in ra hai
chữ cái rời: `GB`, `KR`, `VN`.

Đây là chuyện của **hệ điều hành**, không phải trình duyệt:

| | Chrome | Edge | Firefox |
|---|---|---|---|
| Windows | GB, KR | GB, KR | 🇬🇧 🇰🇷 — Firefox tự đóng gói font emoji riêng |
| macOS / iOS / Android | 🇬🇧 🇰🇷 | 🇬🇧 🇰🇷 | 🇬🇧 🇰🇷 |

Vì vậy `@font-face` **'Flag Emoji'** trỏ tới `public/fonts/TwemojiCountryFlags.woff2`, và
tên này đứng **đầu** `--font-sans`.

- **`unicode-range: U+1F1E6-1F1FF` là phần quan trọng nhất**, không phải cho gọn: nó khoá
  font vào đúng khối regional indicator, nhờ đó trình duyệt (1) chỉ tải file khi trang
  thật sự có ký tự cờ, và (2) mọi chữ còn lại vẫn là Helvetica Neue. Thiếu dòng này là
  font cờ tranh mất những glyph khác mà nó có.
- **Phải đứng ĐẦU stack.** Đặt sau `--font-app` là vô nghĩa: font chính "khớp" trước dù
  không có glyph cờ, và cờ lại rơi về font hệ thống.
- **Thiếu file thì không hỏng gì** — trình duyệt bỏ qua `@font-face` không tải được và rơi
  về font kế tiếp, tức đúng hành vi cũ. Chỉ có một dòng 404 trong console.

Đã kiểm trên `/de-thi`: face `status=loaded`, `document.fonts.check` trả `true` cho
🇬🇧 🇰🇷 🇻🇳 🇩🇪, và bề rộng canvas của 🇬🇧 khác giữa hai font stack (32 so với 32,42) — tức
font cờ thật sự đang vẽ chứ không rơi về font hệ thống.

#### Ghi công — bắt buộc, không phải phép lịch sự

`public/fonts/TwemojiCountryFlags.woff2` (78.292 byte) lấy từ gói npm
[`country-flag-emoji-polyfill`](https://www.npmjs.com/package/country-flag-emoji-polyfill)
`0.1.10` của **TalkJS**. Chỉ copy đúng file font, **không** thêm gói vào `package.json` —
dự án không cần đoạn JS nào của nó.

| phần | giấy phép |
|---|---|
| code của gói | MIT © 2022 TalkJS |
| **hình cờ** | **CC-BY-4.0**, từ [Twemoji](https://twitter.github.io/twemoji) (Twitter/X) |

CC-BY-4.0 cho dùng cả trong sản phẩm thương mại **nhưng buộc phải ghi công**. Đây là điểm
khác hẳn Helvetica Neue bên trên — cái đó không có giấy phép nào cả. Đừng xoá dòng credit
trong `globals.css` cạnh `@font-face`.

**Giấy phép — đọc trước khi phát hành.** Helvetica Neue là font thương mại của
Monotype/Linotype; ba file trong `app/fonts/` là bản việt hoá lưu hành tự do, **không kèm
giấy phép webfont**. Chạy nội bộ thì được; đưa sản phẩm ra ngoài phải mua giấy phép hoặc
thay bằng font có giấy phép mở phủ đủ tiếng Việt (Inter, Be Vietnam Pro, Archivo). Cùng
loại ràng buộc với ảnh hotlink của tầng game.

Cũng vì tự host: `.otf` không nén, ba file cộng lại **487KB**. Máy dev không có
Python/fontTools nên chưa subset và convert sang `.woff2` được — làm được thì còn khoảng
một phần tư. Đó là việc phải làm trước khi phát hành, không phải tối ưu cho vui.

---

## Con dấu thương hiệu

Cặp kính ở góc trái trên, `public/logo-glasses.svg`, vẽ bằng **CSS mask** chứ không nhúng
SVG vào JSX: file là bản trace nên riêng dữ liệu path đã 20KB, nhúng inline là 20KB đó
lặp lại trong HTML của mọi trang. Mask lấy màu từ `currentColor` nên con dấu **khớp màu
với chữ quanh nó** thay vì bị đóng cứng — file gốc tô chết `#151a26`, mask thì không quan
tâm màu trong file. Đây vốn là cách để nó tự lật theo dark mode; dark mode đã bỏ nhưng
cách dựng này vẫn đúng và vẫn tiện hơn nhúng inline.

`aspect-ratio` trong `.logo-mark` phải khớp viewBox đã cắt sát nét của file; đổi viewBox
mà quên đổi con số này thì logo bị bóp hoặc bị cắt.

**Lề trái và lề trên của `(landing)/layout.tsx` phải trùng khít `app-shell.tsx`.** Con
dấu là mốc neo đứng yên giữa lúc mọi thứ khác trượt, nên lệch vài px là nó giật một cái
ngay giữa hiệu ứng. Cỡ con dấu là hằng số dùng chung `BRAND_LOGO_SIZE` (48px chiều cao —
bề ngang tự ra 1,5 lần theo `aspect-ratio`), đừng gõ số rời.

**Lề NGANG khớp nhau là đủ dễ; lề DỌC mới là chỗ đã trượt.** Bên AppShell, chiều cao hàng
chứa con dấu do hàng nav quyết định; bên trang giới thiệu không có nav nào nên phải khai
tay. Chỗ đó từng gõ `min-h-11` (44px) kèm ghi chú "đúng bằng hàng pill" — đúng lúc viết,
rồi hàng nav nở gấp rưỡi (icon 22 → 28) mà con số kia nằm im. **Đo được: con dấu lệch
14px giữa hai khung** (`top` 33 so với 47), tức mốc neo giật một cái ngay giữa hiệu ứng.

Giờ chiều cao đó **tính ra** từ chính các số dựng nên hàng nav, và cả hai khung cùng đọc
một biến `--brand-row-height`:

```
icon + 2*đệm dọc pill + 2*viền pill + 2*đệm rail  =  28 + 30 + 2 + 12  =  72px
```

`.nav-pill` và `.nav-rail` lấy đệm từ chính các biến đó, nên đổi cỡ pill là chiều cao hàng
tự theo. Còn đúng **một** chỗ trùng lặp không khử được bằng CSS: `--nav-icon-size` phải
khớp `<Icon size={28} />` trong `app-shell.tsx`, vì cỡ icon nằm trong TSX.

Trần trên của `BRAND_LOGO_SIZE` là 72px: con dấu cao hơn hàng nav thì nó tự nống header
của AppShell lên, và hai khung lại lệch — bên trang giới thiệu không có gì để nống theo.

### Trademark "NERDY HUB" — chữ thật, và chỉ có ở trang giới thiệu

Đặt cạnh con dấu trong `(landing)/layout.tsx`. Dựng bằng **text**, không phải ảnh: web đã
chạy Helvetica Neue nên chữ sắc nét ở mọi độ phân giải và mọi cỡ, không tốn thêm một
request nào, và ăn màu từ `currentColor` y như con dấu. Ảnh bitmap thì mờ trên màn retina
và phải đổi file mỗi lần đổi cỡ hay đổi màu chữ.

**Không đưa vào `<LogoMark>`.** Trong ứng dụng, header còn hàng nav sáu tab và cụm nút bên
phải; thêm chữ vào là hàng đó chật và con dấu mất vai trò mốc neo của hiệu ứng chuyển
trang. Đã kiểm: `/dashboard`, `/de-thi`, `/thong-ke` đều không có chuỗi này trong HTML.

**Trượt ra từ SAU con dấu** — cơ chế là một khung cắt đứng yên, chữ trượt bên trong:

- `overflow: hidden` trên `.brand-wordmark` dựng cái mép mà bên trái nó không vẽ gì. Khung
  đặt **sát mép phải con dấu** (đo được: lệch 0px), nên chữ chui ra đúng từ sau con dấu.
- `padding-left: 12px` nằm ở **khung**, không phải `gap` của thẻ `<a>` cha: overflow cắt ở
  mép hộp padding, để `gap` thì mép cắt bị đẩy sang phải 12px và chữ hiện ra từ giữa
  khoảng trống.
- `padding-block: 4px` + `margin-block: -4px`: overflow cắt cả chiều dọc, mà `leading: 0.9`
  làm hộp dòng thấp hơn nét chữ — không chừa chỗ thì đỉnh chữ hoa bị xén. Margin âm bù lại
  nên bố cục không đổi một px nào.
- `translateX(-100%)` chứ không phải số px: `-100%` là bề rộng chính nó, đổi cỡ chữ hay
  đổi tên thương hiệu vẫn đúng.
- **Mask gradient 10px ở mép trái** làm mềm chỗ cắt. Thiếu nó thì chữ "nảy" ra khỏi một
  mép cứng — đó là chỗ đọc ra thô nhất. 10px chứ không rộng hơn: chữ lúc nghỉ bắt đầu ở
  12px nên vùng mờ kết thúc trước khi chạm nét.

**"HUB" đi sau "NERDY" nửa giây, ở cả hai chiều.** Vì vậy animation đặt trên **từng dòng**
chứ không phải khối chữ chung; `--wordmark-lag` là **chỉ số dòng** (0, 1) nhân với
`--wordmark-stagger`, nên thêm dòng thứ ba là tự có nhịp.

| | NERDY | HUB |
|---|---|---|
| vào (560ms) | bắt đầu 90ms, xong 650ms | bắt đầu 290ms, xong **850ms** |
| ra (350ms) | bắt đầu 60ms, xong 410ms | bắt đầu 260ms, xong **610ms** |

⚠️ **Chính dòng "HUB" quyết định `POP_OUT_MS`** (630ms trong `nav-slide.tsx`), chứ không
phải hiệu ứng nảy của nội dung (xong ở 412ms). Chữ phải thụt hết vào sau con dấu *trước*
khi trang đổi, vì bên ứng dụng không có trademark nào để nối tiếp. Hệ quả phải biết: cú
bấm "Vào học thôi" chờ **0,63 giây** rồi mới điều hướng, cộng thêm ~750ms dãy thẻ nảy lên
bên dashboard.

`--wordmark-stagger` (200ms) là chỗ đáng cắt nhất nếu cần nhanh hơn nữa — nó từng là 500ms
và một mình chiếm quá nửa thời gian chờ. Cắt xong nhớ **tính lại `POP_OUT_MS`** — hai chỗ
này là một cặp.

### Bố cục hero: chặn bề ngang, và nâng bằng CẶP lề

Cụm hero chặn `max-w-[1240px]` rồi `mx-auto` — căn giữa thay vì trải hết bề ngang thẻ
trắng. Dưới 1240px con số này không đổi được gì, chỉ màn hình rộng mới thấy khác. Chọn
chặn bề ngang chứ không dồn chữ vào giữa từng dòng, vì bố cục hai cột (khẩu hiệu trái /
mô tả phải) đã được chỉnh theo breakpoint `xl` với lý do riêng ghi trong code.

**Nâng cụm lên 24px phải dùng `md:-mt-6` KÈM `md:mb-6`, không được chỉ đặt lề âm.** Khối
hero là `flex-1` trong một cột flex: chỉ lề âm thì phần chiều cao khả dụng tăng thêm 24px
và hàng minh hoạ (cũng `flex-1`) nở ra đúng chừng đó — tức **ảnh to lên**. Lề dương bù cho
tổng chỗ chiếm bằng 0, khối chỉ dịch lên chứ không giãn. Đã đo: mép trên ảnh 107 → 83,
chiều cao ảnh 419,8 → 419,8.

Cũng không dùng `transform: translateY` dù nó giữ nguyên kích thước — transform biến khối
này thành containing block của mọi con `absolute`, một cái bẫy nằm chờ người sau thêm
tooltip hay popover vào hero.

⚠️ Hộp ảnh giờ **trùm lên dải header 20px**. Nó chỉ vô hại vì phần trên cùng của file PNG
là khoảng trong suốt — nét vẽ bắt đầu thấp hơn. Đổi bộ ảnh minh hoạ thì kiểm lại chỗ này.

### Nút đăng nhập ở góc phải trang giới thiệu

`components/landing/landing-auth.tsx`, đặt trong `(landing)/layout.tsx` đối xứng với con
dấu (đo được: lề phải 17px, đúng bằng lề trái của con dấu).

**Phải là client component.** Gọi `auth()` ở layout là đọc cookie, mà đọc cookie thì Next
chuyển cả route sang render động — trang giới thiệu đang ISR (`revalidate = 3600`) sẽ mất
SSG/ISR cùng phần SEO đi kèm. Chỉ mỗi cái nút cần biết người dùng là ai nên nó tự hỏi
`useSession()`. Đây là cùng một quyết định đã ghi ở `components/providers.tsx`, không phải
ngoại lệ mới.

Hệ quả bắt buộc phải xử lý: lần render đầu **chưa** có session, nên trạng thái `loading`
trả về một khối giữ chỗ **đo đúng cỡ nút thật** (108,7 × 39,8px → `h-10 w-[109px]`, lệch
0,3px). Ước lượng cho gần đúng thì lúc session về cả cụm nhích một cái. Đổi padding hay cỡ
chữ của nút thì phải đo lại con số này.

**Nút này và nút "Đăng nhập" trong AppShell phải giống hệt nhau**, vì cùng một hành động:
cả hai là `btn-secondary px-4 py-2 text-[14.5px]` (nền sáng, chữ tối), 108,7×39,8px, lề
phải 29px tính từ mép thẻ trắng. Trước đây bên AppShell dùng `btn-primary` (nền đen) —
cùng một việc mà hai màu thì người dùng đọc ra là hai thứ khác nhau. Chênh lệch còn kéo
theo kích thước: `btn-secondary` có viền 1px nên cao hơn 2px, và vì nút canh giữa theo
hàng header nên mép trên lệch 1px giữa hai trang.

Người đã đăng nhập thấy tên mình thay vì chữ "Đăng nhập", và bấm vào là đi bằng
`ENTER_APP` — cùng hiệu ứng với nút CTA cuối hero, để hai lối vào ứng dụng không phải một
cái có hiệu ứng một cái không. Nút nằm ở **layout** nên không mang `--pop-i`: nó đứng yên
cùng con dấu trong lúc phần nội dung nảy lên rồi rút đi.

---

## Tiện ích (`/tien-ich`)

Ba mục cho phút giải lao: **Pomodoro** (có tiếng mưa), **More or Less**, **Wordle từ vựng**.

### Ô Tiện ích ở Tổng quan chỉ là LỐI TẮT

Ba dòng dẫn sang Pomodoro / More or Less / Wordle, mỗi dòng đúng **một** dòng mô tả
(`truncate` là chốt chặn — hai dòng là ô cao thêm 18px mỗi mục).

Đã thử nhúng hẳn đồng hồ Pomodoro chạy được vào đây rồi bỏ: ô này nằm cạnh Lịch và Việc
hôm nay trong một hàng ba cột, mà một tiện ích chạy thật thì luôn cần thêm nút, thêm
trạng thái, thêm chiều cao — nó nống cả hàng lưới lên và biến ô "giới thiệu có gì" thành
ô "làm việc". Pomodoro có màn hình riêng yên tĩnh của nó. Thêm tiện ích mới thì thêm vào
`ITEMS`; quá bốn dòng thì rút bớt chứ đừng cho ô cao thêm.

Vì không còn tính năng nào chạy ở đây nên nó là **server component** — không kéo theo JS
nào xuống trình duyệt.

### Lịch tháng: ngày lễ được TÍNH RA, không kê bảng

Widget Lịch ở Tổng quan đánh dấu ngày nghỉ lễ Việt Nam (`lib/holidays.ts`). Hai ngày quan
trọng nhất là ngày **âm lịch** — Tết Nguyên đán (mùng 1 tháng Giêng) và Giỗ Tổ Hùng Vương
(mùng 10 tháng Ba) — nên chúng rơi vào ngày dương khác nhau mỗi năm. Một bảng gõ tay sẽ
đúng vài năm rồi âm thầm sai, mà sai theo hướng tệ nhất: lịch vẫn hiện bình thường, chỉ là
đánh dấu nhầm ngày.

Phần âm lịch quy đổi bằng thuật toán thiên văn (kiểu Hồ Ngọc Đức): tìm ngày Sóc và kinh độ
Mặt Trời để dựng tháng âm rồi đổi ngược ra ngày dương. **Múi giờ đóng cứng UTC+7** chứ
không đọc từ máy người dùng — có năm thời điểm Sóc rơi sát nửa đêm, tính bằng múi giờ khác
là Tết lệch hẳn một ngày.

Đã đối chiếu Tết 2020–2028 (khớp cả 9), Giỗ Tổ 2024 (18/4) và 2025 (7/4). Riêng 2030 thuật
toán cho 2/2 trong khi con số đối chiếu là 3/2 — mốc xa nhất và không tự xác minh được, ghi
lại đây để ai cần thì kiểm.

Ba lớp đánh dấu, ưu tiên: **hôm nay > ngày lễ > có luyện đề**. Ngày lễ để trên ngày luyện
đề vì hai thứ trả lời hai câu khác nhau: "hôm đó mình có học không" thì người dùng tự nhớ,
còn "hôm đó có được nghỉ không" thì phải tra.

Ô ngày cố ý **không** dùng `aspect-square`: ô vuông theo bề rộng cột làm cả khối cao gần
300px và nống hẳn hàng lưới ba cột. Chiều cao cố định `h-9` giữ lịch đọc được mà thấp hơn.

Hai nút đổi tháng dùng **functional update** (`setCursor(c => …)`), không đọc `cursor` từ
closure: React gộp setState trong cùng một nhịp, nên bấm nhanh nhiều lần thì mọi lần đều
tính từ cùng một `cursor` cũ. Đo được: bấm 6 lần chỉ lùi 1 tháng.

**Cả khu này là client component thuần.** `localStorage` + Web Audio, không truy vấn DB,
không đi qua `content-filter`, không có route API nào. Đây là ranh giới cố ý chứ không
phải chuyện tiện tay: một cái game hỏng thì hỏng một mình nó, không kéo theo kho đề hay
phòng thi. Ai thêm tiện ích mới mà thấy mình cần chạm vào Prisma thì hãy dừng lại và đọc
`lib/content-filter.ts` trước.

### More or Less — luật dữ liệu quan trọng hơn luật chơi

- **Chỉ so cùng loại, cùng cấp.** Quốc gia với quốc gia, tỉnh với tỉnh. Trộn hồ với đảo,
  hay tỉnh với quốc gia, thì câu hỏi trở nên vô nghĩa chứ không phải "khó hơn". Mỗi pool
  cần ≥6 item, giá trị đôi một khác nhau, đơn vị đồng nhất trong cả pool.
- Số liệu tỉnh VN dùng **mốc hành chính trước sáp nhập 2025**, nhất quán toàn bộ
  `POOLS`. Đổi sang mốc 34 tỉnh thì phải đổi hết, đổi một nửa là so hai hệ khác nhau.
- `fmtFull()` in **số đầy đủ có ngăn cách** ("9.700.000"), không rút gọn — người chơi
  đang so hai con số, làm tròn là lấy mất chính cái họ cần nhìn.

### Ảnh minh họa là hotlink bên thứ ba — chỉ dùng cho dev/nội bộ

`components/game/image-manifest.json` chứa **URL trỏ thẳng sang máy chủ của người khác**
(DuckDuckGo Images, iTunes Search API), sinh bằng `npm run make:game-img`. Ảnh vẫn thuộc
bản quyền gốc; manifest có ghi credit từng ảnh nhưng **không** vì thế mà thành giấy phép
phát hành. Trước khi đưa sản phẩm ra ngoài phải thay bằng ảnh tự có quyền.

`ValueCard` render bằng `<img>` + `referrerPolicy="no-referrer"` và `onError` thu về
layout chữ, nên ảnh chết hay bị chặn hotlink là **vô hại** — không để lại ô trống. Đó
cũng là lý do thiếu vài ảnh không phải lỗi cần sửa gấp.

### Wordle — bàn phím 12 phím

5 chữ của đáp án + 7 chữ nhiễu. Bộ phím của chế độ **Trong ngày** sinh *seeded* theo đáp
án (FNV-1a), nên tải lại trang giữa ván không đổi bộ phím — nếu nó đổi, người chơi vừa
được lộ thêm thông tin. Chế độ luyện tập thì random mỗi ván. Mọi từ trong
`wordle-words.ts` phải khớp `/^[a-z]{5}$/`.

### Ba cạm bẫy khi sửa tầng game

**Key phải ổn định khi một phần tử ĐỔI VAI.** Thẻ vừa mở của More or Less trượt sang ô
trái để thành mốc so sánh cho câu kế. Nó giữ được DOM node là nhờ key theo item; đổi key
thành index thì React remount và con số **count-up lại từ 0** mỗi câu, đúng cái con số
người chơi vừa đọc xong.

**Định vị slot bằng `transform`, không dùng `left`/`right`.** Chỉ transform mới cho
transition mượt khi thẻ đổi slot.

**`react-hooks/set-state-in-effect`.** setState trong callback (`setTimeout`/rAF) thì
không sao; chỗ buộc phải setState thẳng trong effect (khôi phục state sau hydrate) thì
đặt `// eslint-disable-next-line react-hooks/set-state-in-effect` **đúng dòng setState
đầu tiên** của khối — đặt lệch một dòng sẽ warn "unused".

### Tiếng mưa

`public/audio/rain-loop.mp3` là **bản ghi thật**: "Rain Sound" của boons_freak (Pixabay
ID 188158). Muốn bản khác thì thay file tại chỗ, giữ nguyên tên là chạy — nhớ sửa credit
ở comment đầu `rain-sound.ts` và tooltip nút 🌧️. Trạng thái BẬT **không** khôi phục sau
reload, chỉ âm lượng được nhớ: đó là autoplay policy của trình duyệt, không phải bug.

---

## Chưa có trong đợt này

| | Ghi chú |
|---|---|
| F8 — Admin CMS | Chưa có. Nhập đề hiện qua `prisma/seed-data.ts`. |
| Kỹ năng NÓI | **Bỏ hẳn khỏi sản phẩm**, không phải "làm sau". Thi nói cần giám khảo hoặc chấm bằng model; giữ một dạng câu không bao giờ chấm được chỉ tạo ra những con số "chưa chấm" lửng lơ trên trang kết quả. `SKILLS` và `QUESTION_TYPES` trong `lib/enums.ts` không còn `SPEAKING`, và đề Goethe A1 chỉ còn Hören / Lesen / Schreiben. Trang đề nói rõ phần thiếu — xem [Thêm kỳ thi mới](#thêm-kỳ-thi-mới). |
| Chấm ESSAY | Ngoài phạm vi v1 theo SPEC. Đánh `isCorrect = null`, loại khỏi tổng điểm, hiển thị rõ. |
| Cron nhắc lịch ôn (F5) | Bảng `Reminder` và việc tạo sự kiện Google Calendar đã chạy; còn thiếu tiến trình định kỳ để bắn nhắc nhở. |
| Test tự động (Vitest/Playwright) | Chưa có test runner. Thay vào đó là hai script khẳng định bất biến — `check:content-filter` và `check:exam-flow` — cộng với verify thủ công qua trình duyệt. |
| Ảnh `GDP\|Tây Ban Nha` | Thiếu trong `image-manifest.json` (DuckDuckGo miss vài lần liền). Thẻ tự về layout chữ nên không hỏng gì. Muốn có ảnh: xoá key đó khỏi manifest rồi chạy `npm run make:game-img`. |

Audio trong `public/audio/` là **file tone placeholder** do `scripts/make-placeholder-audio.mjs`
sinh ra, không phải bản ghi thật — đủ để kiểm chứng hành vi phát một lần / không tua.

Nội dung câu hỏi trong seed là **tự biên soạn theo định dạng** của từng kỳ thi, không sao
chép đề thi thật.

---

## Lệnh hay dùng

```bash
npm run typecheck
```

```bash
npm run db:peek
```

```bash
npm run db:reset-attempts
```

`db:reset-attempts` xoá hết lượt làm bài nhưng giữ nguyên nội dung đề — tiện khi test lại luồng.

`db:seed` nạp lại **nội dung** và **giữ nguyên tài khoản người dùng**. Lượt làm bài thì
mất theo, vì chúng trỏ tới các đề sắp được dựng lại với id mới. Muốn xoá sạch cả tài
khoản (dựng máy từ số 0):

```bash
RESET_USERS=1 npm run db:seed
```

---

## Thêm kỳ thi mới

Thẻ kỳ thi ở `/de-thi` là **nền trắng + một dải màu dọc bên trái**. Dải bám theo **ngôn
ngữ** (`LANGUAGE_STRIPES` trong `lib/enums.ts`), nên kỳ thi mới tự có dải mà không phải
khai gì thêm — miễn là ngôn ngữ của nó đã nằm trong `LANGUAGES`.

Bản trước tô nền pastel theo `cardTone(i)`, tức theo **thứ tự thẻ trong danh sách**: cùng
một kỳ thi lại mang màu khác nhau tuỳ nó đứng thứ mấy, nên màu không nói lên điều gì và
người dùng không nhớ được. Giờ VSTEP ở đâu cũng là dải Anh.

Dải là **màu tượng trưng, không phải cờ thu nhỏ**: cờ thật có tỉ lệ, ngôi sao, huy hiệu —
nhét vào 6px thì thành vệt bẩn, mà lại dễ vẽ sai quốc kỳ của người ta. Các mốc màu trong
gradient **trùng nhau ở mỗi ranh giới** để ra băng cứng; gradient mềm sẽ trộn đỏ với vàng
thành cam, một màu không có trên lá cờ nào trong danh sách.

**Số màu không cần bằng nhau giữa các ngôn ngữ.** `languageStripe()` chia đều dải theo số
màu, nên một màu ra dải trơn, hai màu ra hai băng bằng nhau. Hiện tại: Việt **đỏ trơn**,
Anh **đỏ / navy**, Hàn **trắng / xanh**, Đức **đen / đỏ / vàng**.

⚠️ Màu trắng trong dải nằm trên **thẻ nền trắng** nên gần như không nhìn thấy — dải Hàn
đọc ra là một vệt xanh chỉ cao nửa thẻ, dải Nhật cũng vậy. Đó là hệ quả của việc chọn màu,
không phải lỗi dựng. Muốn thấy phần trắng thì phải cho dải một viền mảnh hoặc đổi trắng
thành trắng ngà.

Nhập đề vẫn qua `prisma/seed-data.ts` (F8 Admin CMS chưa có). Có đúng một trường dễ
quên nên nó được đặt là **bắt buộc** để TypeScript nhắc thay bạn:

```ts
/** Phần NÓI của bài thi THẬT, tính bằng phút. null = kỳ thi vốn không có phần nói. */
realSpeakingMinutes: number | null
```

Sản phẩm không dựng phần nói, nhưng bỏ nó trong im lặng thì thí sinh luyện với đề 65
phút rồi bước vào phòng thi thật 80 phút. Khai số phút thì trang đề tự hiện ghi chú
"Đề này không có phần Nói… tổng cộng vào khoảng N phút"; khai `null` thì không hiện gì
— đúng cho TOPIK II và THPT Quốc gia môn Tiếng Anh, vốn chưa bao giờ có phần nói.

Trường này **không được optional**: optional nghĩa là quên một kỳ thi mới là xong,
không ai báo gì. Bắt buộc thì trình biên dịch buộc người thêm đề phải TRẢ LỜI câu hỏi,
kể cả khi câu trả lời là `null`.

---

## Những cái bẫy đã mất thời gian, ghi lại để khỏi vấp lại

**Đổi schema Prisma thì phải KHỞI ĐỘNG LẠI `next dev`.** `prisma migrate dev` cập nhật
DB và sinh lại client trên đĩa, nhưng tiến trình dev đang chạy vẫn giữ module cũ trong
bộ nhớ. Triệu chứng là 500 với `Unknown field ... for select statement` trong khi
`npm run typecheck` sạch bong và mọi script chạy đúng. Kiểu lỗi âm thầm hơn: cột mới
đọc ra `undefined`, nên `x !== null` lọt và giao diện hiện ra "khoảng  phút… NaN phút".
Vì vậy hãy kiểm `typeof x === 'number'` chứ đừng kiểm `!== null`.

**Đừng dùng `bg-white` cho một bề mặt — `bg-card` mới là token đúng.** Lý do gốc là dark
mode (`--color-card` tự lật, `bg-white` thì không) và dark mode đã bỏ; nhưng quy tắc vẫn
giữ, vì đi qua token là điều kiện để đổi bảng màu ở một chỗ. Cùng tinh thần đó, chữ đặt
trên pastel đặc (`bg-mint`, `bg-lime`, `bg-rose`…) vẫn dùng `text-on-tone` chứ không phải
`text-ink`: hai token đó tình cờ trùng giá trị ở bảng màu sáng, nhưng chúng mang hai ý
nghĩa khác nhau — một là "chữ trên nền pastel", một là "chữ trên bề mặt thường".

**Đừng THÊM hay BỎ viền theo trạng thái — chỉ đổi màu nó.** `box-sizing` là `border-box`,
nên một trạng thái có `border: 1px` còn trạng thái kia `none` sẽ làm toàn bộ nội dung bên
trong xê dịch đúng 1px. Dùng `border: 1px solid transparent` rồi đổi `border-color`. Bẫy
này phát hiện ra khi bật/tắt dark mode, nhưng nó áp cho mọi cặp trạng thái — hover, active,
`.dark` hay bất cứ thứ gì thêm sau này.

**Muốn viền thẻ đậm hơn thì đổi MÀU, đừng nới px.** Cùng một lý do `border-box`: tăng
`.card` lên 1,5px là nội dung bên trong *mọi* thẻ co lại 0,5px mỗi cạnh. `.card` dùng
`--color-line-strong` chứ không phải `--color-line`, và token đó đã hạ tông xuống
`#c0cede`:

| màu viền | tương phản với nền trắng |
|---|---|
| `#e7edf4` (`--color-line`) | 1,18 — gần như không đọc được đường ranh |
| `#d9e2ec` (giá trị cũ) | 1,31 |
| **`#c0cede` (hiện tại)** | **1,60** |

Token này khai ở **hai** nơi trong bảng màu sáng: `@theme` và `.theme-light` (khối khoá
sáng riêng cho trang giới thiệu). Sửa một chỗ là trang chủ mang màu viền khác phần còn
lại của web. Nó còn dùng cho viền hover của `.btn-secondary` và núm thanh cuộn
`.thin-scroll` — cả hai đậm theo, và đó là hướng đúng cho cả hai. Dark mode không đụng
tới: ở đó `--color-line-strong` (`#3a4356`) **sáng hơn** `--color-line`, nên viền vẫn là
thứ nổi lên khỏi nền.

**`position: relative` đặt nhầm chỗ có thể nống bố cục lên gấp ba.** Nhãn tooltip của
nav (`.nav-tip`) vốn là `absolute`; thêm một dòng `position: relative` để nâng nó lên
trên ô đen là kéo nó trở lại dòng chảy bố cục, và chữ nhãn (đang `nowrap`) nống mỗi tab
từ 51px lên 143px. Muốn nâng thứ gì lên trên thì kiểm `z-index` của nó trước — cái đang
`absolute` thường đã có sẵn.

**Đừng chạy `npx prettier` trên repo này.** Dự án không có file cấu hình Prettier, nên
nó sẽ chạy với mặc định (nháy kép, chấm phẩy) và định dạng lại ngược hoàn toàn với văn
phong đang dùng (nháy đơn, không chấm phẩy). `npm run lint` mới là công cụ đúng.

**Trong flex container, chữ phải nằm trong đúng MỘT phần tử.** `<li className="flex
gap-2"><Icon/>chữ <strong>đậm</strong> chữ</li>` tạo ra BỐN flex item, không phải hai:
mỗi đoạn text và mỗi thẻ inline là một item, tự xuống dòng riêng và bị `gap` chèn
khoảng trắng vào giữa. Câu văn vỡ thành nhiều mảnh đặt sai chỗ. Bọc phần chữ trong
`<span>`.

**`sr-only` là `position: absolute`.** Phần tử cha bọc nó phải `relative`, nếu không
khối chứa của nó là cả viewport: nó thoát khỏi mọi khung `overflow`, kéo dài chiều cao
cuộn của tài liệu và để lại một mảng nền trống không giải thích được.
