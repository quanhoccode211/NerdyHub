# Nerdy Hub

Kho đề và phòng thi thử trực tuyến: VSTEP, TOPIK, Goethe, THPT Quốc gia, IELTS. Làm bài có bấm
giờ như thi thật, chấm tự động, xếp hạng phần trăm.

Next.js 16 · React 19 · Prisma 7 · PostgreSQL · Auth.js v5 · Tailwind 4

Xong F1–F6. Chưa có F8 (Admin CMS) — nhập đề qua `prisma/seed-data.ts`.

## Quy ước làm việc

⛔ **Không `git push` nếu chủ dự án không yêu cầu.** Áp dụng cho mọi phiên làm việc,
mọi người và mọi trợ lý AI đụng vào repo này. Sửa xong thì dừng lại và báo, chờ có
yêu cầu rõ ràng rồi mới đẩy lên.

Lý do không phải hình thức: nhánh `vers-1.0` nối thẳng với Vercel, nên **push là
deploy** — không có bước duyệt nào ở giữa (xem [Deploy](#deploy)). Một cú push tự phát
là một lần đưa bản chưa ai xem lên chạy thật.

Được yêu cầu push một lần **không** có nghĩa là được push ở những lần sửa sau. Mỗi lần
là một lần xin phép riêng.

## Chạy

Cần một Postgres trước. Tạo ở [Neon](https://neon.com) (free), chép `.env.example` thành
`.env`, điền `DATABASE_URL`.

```bash
npm install && npm run setup && npm run dev
```

`setup` chạy migration, nạp đề mẫu, sinh audio placeholder. Mở localhost:3000 — không cần
đăng nhập để làm bài.

Không chạy SQLite được nữa: `provider` của Prisma là hằng trong schema, không đọc từ biến
môi trường.

## Deploy

Vercel, nhánh **`vers-1.0`** là bản chạy thật. Bốn biến: `DATABASE_URL`, `AUTH_SECRET`,
`ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`. Hai khoá giữa sinh bằng `npm run gen:secrets`.

**`vers-1.1-beta`** là nhánh đang làm (đa ngôn ngữ, hiệu ứng chuyển trang, bộ mascot mới).
Vercel dựng nó thành bản xem thử ở URL riêng, KHÔNG đụng vào bản chạy thật. Muốn đưa lên
production thì gộp vào `vers-1.0`, hoặc đổi Production Branch trong Settings → Git.

Ba thứ đã mất thời gian:

- **`build` phải gọi `prisma generate`.** `lib/generated/` nằm trong `.gitignore` nên máy
  build sạch không có nó. Đặt trong `build` chứ không phải `postinstall` — Vercel cache
  `node_modules` và có thể bỏ qua postinstall.
- **Vùng chạy hàm phải khớp vùng database.** Mặc định `iad1` (Mỹ) trong khi Neon ở
  Singapore nghĩa là mỗi truy vấn vượt Thái Bình Dương hai lượt. Đọc `X-Vercel-Id` để biết
  đang ở đâu; sửa ở Settings → Functions → Function Region. Đo được: dashboard 650ms →
  320ms.
- **`DATABASE_URL` phải có lúc BUILD**, không chỉ lúc chạy. `generateStaticParams` đọc DB
  để dựng sẵn trang đề.

Nút Redeploy dựng lại commit CŨ. Muốn deploy bản mới thì push.

## Kiến trúc

```
app/
  (marketing)/   Trang công khai, ISR, JSON-LD
  (app)/         Sau đăng nhập — dùng AppShell
  (exam)/thi/    PHÒNG THI, cố ý không có rail điều hướng
  api/attempts/  Tạo / khôi phục / đồng bộ / nộp bài
lib/
  content-filter  Chốt chặn canPublish
  exam-clock      GRACE_SEC + overdueSeconds
  sanitize-html   Lọc HTML đường GHI — KHÔNG import từ route (kéo theo jsdom)
  scoring/        Strategy theo kỳ thi + engine chung
  auth/           Session, tuổi, consent (NĐ 13/2023)
  calendar/google freeBusy, chỉ đọc
  i18n/           config, messages (vi/en/de), server.getT()
components/
  exam-room/      Store, sync 3 lớp, highlight, timer
  shell/          AppShell, nav, hiệu ứng chuyển trang
  game/           Tầng game — client thuần, không chạm DB
  i18n/           LocaleProvider — đọc locale ở client
```

## Ba ngôn ngữ

Tiếng Việt · English · Deutsch. Đổi trong menu tài khoản, lưu ở cookie `locale`.

**Không phải bản địa hoá để bán ra nước ngoài.** Người đọc là người Việt đang học ngoại
ngữ — đổi giao diện sang tiếng Anh hoặc Đức là một cách tự đặt mình vào môi trường ngôn
ngữ đích trong lúc luyện đề. Điều đó đổi cách chọn từ, và ba nguyên tắc đi kèm ghi ở đầu
`lib/i18n/messages.ts`: chuẩn mực hơn là bản xứ, nhất quán hơn là phong phú, câu trọn vẹn
hơn là nhãn rút gọn. Tiếng Đức xưng "du" xuyên suốt.

**Tiếng Việt là mặc định cứng.** Không đoán theo `Accept-Language`: máy cài tiếng Anh vẫn
thấy tiếng Việt cho tới khi chủ máy tự đổi.

**Nội dung đề KHÔNG dịch.** Đề, câu hỏi, đáp án, giải thích, tên chứng chỉ — giữ nguyên,
đó là nội dung học thuật.

Thiếu một chuỗi ở `en` hay `de` là **lỗi biên dịch**, không phải lỗi người dùng phát hiện
hộ: hai bản đó khai là `Record<MessageKey, string>` với `MessageKey` suy từ bản tiếng Việt.

Đổi ngôn ngữ chạy `router.refresh()` chứ không `location.reload()` — một phần chữ do
server render bằng `getT()`, nên phải dựng lại thật, nhưng `reload()` thì vẽ lại từ nền
trắng và cắt đứt hiệu ứng. Chi tiết trong `components/i18n/locale-provider.tsx`.

⛔ **Đừng gọi `getT()` trong `app/(marketing)/de-thi/**`.** Nhóm đó là SSG/ISR dựng sẵn từ
database; `cookies()` ép cả route sang render động và xoá sạch phần tĩnh.

### Đã dịch / chưa dịch

| Xong | Chưa |
|---|---|
| Khung: rail, cụm nút phải, menu tài khoản | **Kho đề** — xem kế hoạch dưới |
| Trang giới thiệu (nút đăng nhập) | Phòng thi, Bài đã làm, trang Kết quả |
| Đăng nhập, đăng ký | Cài đặt → **Dữ liệu & quyền riêng tư** (trang con) |
| Tổng quan + cả 5 widget | Form đăng ký: phần ô đồng ý bên trong |
| Tab Tiện ích | Ba trang trò chơi trong tab Tiện ích |
| Thống kê, Lịch ôn (cả lưới tuần), Cài đặt | |

Nhãn thứ trong tuần của lưới Lịch ôn đi theo `locale`, nhưng GIỜ thì không:
`buildWeekGrid` giữ `vi-VN` 24h. `en-US` sinh AM/PM, dài hơn và phá cả bề rộng
khối lẫn nhãn "07:00–09:00" — đó là định dạng của thiết kế, không phải của ngôn
ngữ.

### Kế hoạch dịch Kho đề — CHƯA CHỐT

Đây là phần khó nhất và đang để ngỏ có chủ ý. Hai vấn đề chồng lên nhau:

**1. Mô tả kỳ thi nằm trong DATABASE, không nằm trong code.** `Exam.description`,
`Exam.fullName`, tên cấp độ — tất cả seed từ `prisma/seed-data.ts`. Dịch chúng không phải
là thêm khoá vào `messages.ts`. Ba hướng:

| Hướng | Được | Mất |
|---|---|---|
| Bảng dịch trong code, khoá theo slug | Nhanh, không đụng schema | Tách khỏi nguồn; F8 nhập đề mới sẽ không có bản dịch |
| Thêm cột `descriptionEn` / `descriptionDe` | Đúng chỗ, F8 nhập được luôn | Một đợt migration |
| Bảng `Translation` riêng | Linh hoạt nhất | Nặng nhất, thêm join ở mọi truy vấn |

**2. `/de-thi` đang là SSG/ISR.** Dịch ở server là mất phần tĩnh cùng lợi thế SEO của
SPEC F7. Giữ được cả hai bằng cách dịch ở CLIENT như phần khung: trang vẫn tĩnh, bot vẫn
đọc bản tiếng Việt, người dùng đổi ngôn ngữ thì chữ đổi sau khi hydrate.

Nghiêng về **hướng 1 + dịch ở client**, nhưng chưa quyết. Ai làm tiếp thì đọc lại hai
ràng buộc trên trước khi gõ dòng đầu tiên.

## Hai bất biến

**Không lộ nội dung không được phép.** `provenance.canPublish = false` chặn ở mọi lối ra,
kể cả khi `status = PUBLISHED`. Seed cố tình có một đề như vậy.

```bash
npm run check:content-filter
```

Cụ thể nó chặn cái gì: **đề trong sách luyện thi thương mại** — Cambridge IELTS, Actual
Test, ETS — là nội dung có bản quyền, không phải "đề trôi nổi trên mạng". Chép chúng vào
`seed-data.ts` rồi để `canPublish: true` là đưa nguyên phần thân của một cuốn sách đang
bán lên web công khai. Nhập vào để dùng nội bộ thì gắn `RESTRICTED` + `canPublish: false`
như đề mẫu đã có sẵn trong seed.

Đề của cơ quan nhà nước (đề minh hoạ THPT QG, đề mẫu VSTEP của Bộ GD&ĐT) thì khác — đó là
lý do chúng mang `license: 'GOV_PUBLISHED'`.

**Không lộ đáp án khi đang làm bài.** `loadExamRoom()` chỉ đính `isCorrect` /
`explanation` / `transcript` khi attempt thực sự `SUBMITTED`.

```bash
npm run check:exam-flow
```

9 khẳng định về luồng chấm điểm, dựng thẳng trong DB rồi tự dọn. Xem
[docs/kiem-tra-phong-thi.md](docs/kiem-tra-phong-thi.md).

## Phòng thi

- **Đồng hồ ở server, và server cưỡng chế hạn chót.** `/sync` phát hiện quá hạn thì tự
  chấm ngay trong request đó và trả 409 cho mọi lần sau. Đổi giờ máy hay gọi thẳng bằng
  curl đều không ghi thêm được. `GRACE_SEC = 30` chỉ để hấp thụ độ trễ mạng.
- **Audio "nghe một lần" là trạng thái của SERVER**, cột trên `Attempt`. Tải lại trang
  không đưa nút "Bắt đầu nghe" quay lại.
- **Chống mất bài 3 lớp:** sessionStorage → debounce 3s POST batch → khôi phục từ server.
  Mất mạng thì batch nằm lại hàng đợi và tự gửi khi có `online`.
- **Highlight neo theo offset ký tự** trên `textContent`, không theo cấu trúc DOM.

## Lệnh hay dùng

```bash
npm run typecheck && npm run lint
```

```bash
npm run db:peek
```

```bash
npm run db:reset-attempts
```

`db:reset-attempts` xoá lượt làm bài, giữ nguyên đề. `db:seed` nạp lại nội dung và giữ tài
khoản; thêm `RESET_USERS=1` để xoá sạch.

```bash
npm run sanitize:passages
```

**Chạy sau mỗi lần nạp đề mới.** Lọc HTML của mọi passage đang nằm trong database, ghi đè
tại chỗ — phòng thi không lọc lại lúc đọc nữa (xem "Bẫy đã mất thời gian"). Idempotent,
thêm `--dry` để xem trước mà không ghi.

## Chưa có

| | |
|---|---|
| F8 Admin CMS | Nhập đề qua `prisma/seed-data.ts` |
| Kỹ năng NÓI | **Bỏ hẳn**, không phải "làm sau". Chấm nói cần giám khảo. `SKILLS` không có `SPEAKING`. |
| Chấm ESSAY | Ngoài phạm vi v1. `isCorrect = null`, loại khỏi tổng điểm. |
| Cron nhắc lịch ôn | Bảng `Reminder` đã chạy, thiếu tiến trình định kỳ |
| Test tự động | Chưa có runner. Thay bằng hai script `check:*` ở trên. |
| Dịch Kho đề | Chưa chốt hướng — xem "Ba ngôn ngữ" ở trên |
| IELTS — Nghe / Viết | Mới có Reading. Xem "IELTS" ở dưới. |

`plan.md` ghi một lỗi **chưa sửa**: danh sách "Bài đã làm" có thể trống khi tải lại trang.
Sáu chỗ đọc dữ liệu dùng mẫu `userId ? {userId} : {guestId}` loại trừ nhau.

### IELTS

Có năm đề, đều 3 passage, 40 điểm, 60 phút:

| Đề | Nguồn | Ra ngoài được không |
|---|---|---|
| **Academic Reading — Practice Test 1** | Tự biên soạn | Có — `SELF_AUTHORED`, `canPublish: true` |
| **Cambridge Test 1 → 4** | Sách Cambridge IELTS | **Có** — `RESTRICTED`, `canPublish: true`, `status: PUBLISHED` |

## Thay đổi gần đây

- **Mở khóa 4 đề Cambridge IELTS:** Đã chuyển `canPublish: true` trong các file seed (`prisma/seed.ts` và `scripts/seed-ielts.ts`) và đặt `status: 'PUBLISHED'` trong `prisma/seed-data.ts`.
- **Cập nhật hiển thị đề Cambridge:** Xóa hậu tố "(nội bộ)" khỏi tên đề, đồng thời thêm thuộc tính `attribution` để giải thích nguồn gốc ("Đề từ sách Cambridge IELTS...").
- **Ẩn thông tin Giấy phép trên UI:** Đã xóa dòng hiển thị "Giấy phép" (License) trên trang chi tiết đề thi (`app/(marketing)/de-thi/[examSlug]/[paperSlug]/page.tsx`) và dọn dẹp các truy vấn liên quan trong `lib/queries.ts`.
- **Giữ nguyên cấu trúc gộp câu:** 4 đề Cambridge (Đề 2, 3) có 38 câu trên giao diện nhưng vẫn đủ 40 điểm do gom các câu hỏi "Choose TWO letters" thành 1 câu Multi-choice mang `points: 2` để đảm bảo tính chính xác của thuật toán chấm điểm. Mặc định không thay đổi.
- **Seed Đề thi THPT Quốc gia 2025:** Đã tạo thêm 3 đề thi (Hóa Học, Vật Lý, Tiếng Anh) cho kỳ thi THPT Quốc gia 2025. Cấu trúc chia 2 cửa sổ: Đề bài (Markdown) bên trái, các câu hỏi tương tác dạng 4 lựa chọn (SINGLE_CHOICE) bên phải. (Đã loại bỏ đề Tiếng Anh bản minh họa cũ).
- **Tích hợp KaTeX:** Đã cài đặt thư viện `katex` ở client-side (`passage-view.tsx`, `question-view.tsx`) để tự động render các công thức Toán, Hóa, Lý (bọc bằng `$` hoặc `$$`) trước khi bộ đánh dấu (highlight) hoạt động, tránh lỗi xê dịch highlight.
- **Render bảng Markdown:** Tích hợp bộ phân tích bảng Markdown vào các script seed để tự động tạo mã HTML tương thích với giao diện, đồng thời nâng cấp bộ lọc bảo mật `DOMPurify` cho phép hiển thị các thẻ bảng và thuộc tính `class` để giữ lại cấu trúc viền cột.
- **Cập nhật đề thi 2026:** Đã seed đề Toán, Vật Lý và Hoá 2026 (`scripts/seed-*-2026.ts`), thiết lập mặc định sắp xếp danh sách đề thi theo "Mới nhất" (Newest) ở trang danh mục — và "Mới nhất" nay xếp theo `year` trước, `publishedAt` sau, vì đề 2026 seed sau nhưng đề cũ có thể được nạp lại muộn hơn.
- **Lọc HTML chuyển sang đường ghi:** `DOMPurify` từng chạy ở mỗi lần đọc trong `lib/attempt-service.ts`. Nó kéo theo jsdom, và jsdom không nạp được trong hàm serverless của Vercel — phòng thi trả 500 trên bản deploy trong khi localhost vẫn chạy. Nay lọc nằm ở `lib/sanitize-html.ts`, gọi từ `npm run sanitize:passages`; đường đọc không lọc lại. Xem "Bẫy đã mất thời gian".

Bốn đề Cambridge hiển thị công khai trong Kho đề. Giá trị `canPublish: true` và `status: PUBLISHED`
của bộ đề này **không thay đổi** — đây là trạng thái đã được duyệt.

Nội dung của bốn đề đó nằm riêng ở
[prisma/seed-data-ielts-cambridge.ts](prisma/seed-data-ielts-cambridge.ts) chứ không
trộn vào `seed-data.ts`. Mọi thứ có bản quyền của bên thứ ba gom vào đúng một chỗ thì
gỡ ra là xoá một file, không phải đi dò từng đoạn. Thêm đề chép từ sách nào khác thì
cũng thêm vào đó.

Ranh giới giữa hai nhóm chính là ranh giới của bất biến số 1: **định dạng thì dùng
thoải mái — định dạng không được bảo hộ; nội dung đề của Cambridge, IDP hay British
Council thì không.** Đề đầu tự viết theo định dạng nên phát hành được; bốn đề kia là
nội dung của họ nên không.

Hai chỗ đề Cambridge lệch khỏi khuôn của đề tự biên soạn:

- **Số câu có lỗ.** Dạng "Choose TWO letters" chiếm hai số trong đề gốc (ví dụ
  Questions 20–21) nhưng ở đây là MỘT câu `MULTI_CHOICE` mang `number: 20`,
  `points: 2` — câu kế tiếp là 22. Tổng vẫn đúng 40 điểm, chỉ dãy số là đứt.
- **`IeltsStrategy` bật `partialCreditForMultiChoice`** chính vì những câu đó: đề thật
  cho 1 điểm mỗi lựa chọn đúng, nên chọn được một nửa phải còn nửa điểm chứ không phải
  mất trắng.

Cấu trúc **đề tự biên soạn**, theo đúng thứ tự dạng câu và độ khó tăng dần của đề thật:

| Passage | Câu | Dạng |
|---|---|---|
| The world's appetite for sand | 1–13 | TRUE/FALSE/NOT GIVEN ×6, sentence completion ×4, short answer ×3 |
| Songs with an accent | 14–26 | Matching Headings ×6, multiple choice ×4, summary completion ×3 |
| The ideas an organisation asks for and then refuses | 27–40 | YES/NO/NOT GIVEN ×6, multiple choice ×4, summary completion ×4 |

Ba điểm sẽ vướng nếu viết thêm đề:

- **Mỗi câu 1 điểm, tổng phải đúng 40.** Bảng band trong `SEED_SCORE_CONVERSIONS` tính
  theo phần trăm của 40 câu — mỗi câu 2,5%, 30/40 = 75% = band 7.0. Thêm hay bớt một câu
  là toàn bộ band lệch.
- **Passage 3 dùng YES / NO / NOT GIVEN**, không phải TRUE / FALSE. Đó là quy ước IELTS
  cho bài nghị luận: hỏi về quan điểm người viết chứ không phải sự việc. Về kỹ thuật vẫn
  là `TRUE_FALSE_NOTGIVEN`, chỉ đổi nhãn lựa chọn.
- **Matching Headings dựng bằng `SINGLE_CHOICE`**, danh sách i–viii lặp lại ở từng câu.
  Phòng thi render mỗi câu độc lập, không có chỗ nào hiện được một bảng heading dùng chung
  ở đầu nhóm — hoặc lặp, hoặc thí sinh không nhìn thấy danh sách. Mọi dạng "chọn từ một
  danh sách dùng chung" đều vướng chỗ này: đề Cambridge lặp lại danh sách A–G (matching
  information, sentence endings) và A–C (matching people) ở từng câu vì đúng lý do đó.

`IeltsStrategy` để `skillMaxScale` bằng luôn `maxScale` (9): band kỹ năng và band tổng
trong IELTS là cùng một đơn vị, khác TOPIK (300 = 3 × 100) hay Goethe (100 = 4 × 25) nơi
điểm kỹ năng là một phần của tổng.

Chưa có Listening và Writing. Listening cần file nghe có quyền phát hành; Writing thì
engine v1 không chấm ESSAY (xem "Chưa có").

#### Nạp riêng một kỳ thi, không xoá gì

```bash
npx tsx scripts/seed-ielts.ts
```

`db:seed` mở đầu bằng một loạt `deleteMany()` rồi dựng lại toàn bộ nội dung. Chạy nó lên
database mà bản chạy thật đang đọc là xoá đề của mọi kỳ thi khác cùng mọi lượt làm bài trỏ
tới chúng — và `.env` ở máy phát triển đang trỏ thẳng vào Neon production. Script trên chỉ
THÊM: tìm trước rồi mới tạo nên chạy lại nhiều lần không nhân bản, riêng bảng band thì xoá
đúng dòng `examSlug = 'ielts'` rồi nạp lại.

```bash
npx tsx scripts/seed-ielts.ts --undo
```

Gỡ ra. Từ chối chạy nếu đã có ai làm bài trên đề — xoá đề khi đã có lượt làm là xoá luôn
bài của họ.

**Nạp xong thì chạy `npm run sanitize:passages`.** Phòng thi không lọc HTML lúc đọc nữa,
nên nội dung phải sạch từ lúc nằm trong database.

**Thêm đề mới thì phải build lại.** `/de-thi/[examSlug]/[paperSlug]` dựng bằng
`generateStaticParams` lúc build, nên một đề vừa nạp vào database chưa có đường dẫn trên
bản đã deploy. Push hoặc redeploy là đủ.

## Trước khi phát hành

⚠️ **Font Helvetica Neue trong `app/fonts/` không có giấy phép webfont.** Đây là bản việt
hoá lưu hành tự do, không phải bản Monotype. Chạy nội bộ thì được; ra ngoài phải mua giấy
phép hoặc thay bằng Inter / Be Vietnam Pro / Archivo.

⚠️ **Ảnh tầng game là hotlink bên thứ ba** (`components/game/image-manifest.json`).

Cờ quốc gia (`public/fonts/TwemojiCountryFlags.woff2`) thì sạch: CC-BY-4.0 từ Twemoji, cho
dùng thương mại, chỉ cần giữ dòng credit trong `globals.css`.

## Bẫy đã mất thời gian

- **Đừng import `isomorphic-dompurify` (hay bất cứ thứ gì kéo jsdom) từ code chạy trong
  route.** Turbopack externalize jsdom thành `require("jsdom-<hash>")`, và alias đó không
  nạp được trong hàm serverless của Vercel: mọi route chạm tới nó trả 500 *"Failed to load
  external module"* trong khi `next start` ở máy vẫn chạy — vì máy có sẵn `node_modules`,
  còn Vercel chỉ đóng gói theo trace. Đã sập phòng thi đúng kiểu này. Lọc HTML nay ở đường
  GHI (`lib/sanitize-html.ts` + `npm run sanitize:passages`), không ở đường đọc.
- **Đổi schema Prisma thì khởi động lại `next dev`.** `migrate dev` sinh lại client trên
  đĩa nhưng tiến trình đang chạy vẫn giữ module cũ. Triệu chứng: 500 "Unknown field" trong
  khi `typecheck` sạch.
- **`ECONNREFUSED` từ script `tsx` thường là thiếu `.env`, không phải DB sập.** Next tự nạp
  `.env`, script chạy ngoài Next thì không.
- **Đừng chạy `npx prettier`.** Repo không có config nên nó chạy mặc định và định dạng
  ngược hoàn toàn với văn phong đang dùng. `npm run lint` mới đúng.
- **Đừng thêm hay bớt viền theo trạng thái, chỉ đổi màu.** `box-sizing: border-box` nên nội
  dung xê dịch 1px. Dùng `border: 1px solid transparent`.
- **`bg-card`, không phải `bg-white`.** Đi qua token là điều kiện để đổi bảng màu một chỗ.
- **Trong flex container, chữ phải nằm trong đúng một phần tử.** Mỗi đoạn text và mỗi thẻ
  inline là một flex item riêng, `gap` sẽ chèn khoảng trắng vào giữa câu.

Chi tiết của hiệu ứng chuyển trang, thang chữ và tầng game nằm trong comment ở
`globals.css`, `nav-slide.tsx` và `components/game/`. Chúng dài vì mỗi con số ở đó đều
từng sai một lần.
