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

## Tiện ích (`/tien-ich`)

Ba mục cho phút giải lao: **Pomodoro** (có tiếng mưa), **More or Less**, **Wordle từ vựng**.

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

## Hai cái bẫy đã mất thời gian, ghi lại để khỏi vấp lại

**Đổi schema Prisma thì phải KHỞI ĐỘNG LẠI `next dev`.** `prisma migrate dev` cập nhật
DB và sinh lại client trên đĩa, nhưng tiến trình dev đang chạy vẫn giữ module cũ trong
bộ nhớ. Triệu chứng là 500 với `Unknown field ... for select statement` trong khi
`npm run typecheck` sạch bong và mọi script chạy đúng. Kiểu lỗi âm thầm hơn: cột mới
đọc ra `undefined`, nên `x !== null` lọt và giao diện hiện ra "khoảng  phút… NaN phút".
Vì vậy hãy kiểm `typeof x === 'number'` chứ đừng kiểm `!== null`.

**Nền pastel đặc luôn cần `text-on-tone`.** `--color-card` và các token `*-soft` tự lật
theo giao diện, nhưng pastel đặc (`bg-mint`, `bg-lime`, `bg-rose`…) thì sáng ở CẢ HAI
giao diện — trong khi `--color-ink` lật thành gần trắng. Dùng `text-ink` trên đó là chữ
sáng trên nền sáng ở dark mode. Cũng vì vậy, đừng bao giờ dùng `bg-white` cho một bề
mặt: `bg-card` mới là token đúng.

**Đừng THÊM hay BỎ viền giữa hai giao diện — chỉ đổi màu nó.** `box-sizing` là
`border-box`, nên một bên có `border: 1px` còn bên kia `none` sẽ làm toàn bộ nội dung
bên trong xê dịch đúng 1px khi người dùng bật/tắt dark mode. Dùng
`border: 1px solid transparent` rồi đổi `border-color`.

**Trong flex container, chữ phải nằm trong đúng MỘT phần tử.** `<li className="flex
gap-2"><Icon/>chữ <strong>đậm</strong> chữ</li>` tạo ra BỐN flex item, không phải hai:
mỗi đoạn text và mỗi thẻ inline là một item, tự xuống dòng riêng và bị `gap` chèn
khoảng trắng vào giữa. Câu văn vỡ thành nhiều mảnh đặt sai chỗ. Bọc phần chữ trong
`<span>`.

**`sr-only` là `position: absolute`.** Phần tử cha bọc nó phải `relative`, nếu không
khối chứa của nó là cả viewport: nó thoát khỏi mọi khung `overflow`, kéo dài chiều cao
cuộn của tài liệu và để lại một mảng nền trống không giải thích được.
