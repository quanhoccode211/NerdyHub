# Nerdy Hub

Kho đề và phòng thi thử trực tuyến: VSTEP, TOPIK, Goethe, THPT Quốc gia. Làm bài có bấm
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

## Chưa có

| | |
|---|---|
| F8 Admin CMS | Nhập đề qua `prisma/seed-data.ts` |
| Kỹ năng NÓI | **Bỏ hẳn**, không phải "làm sau". Chấm nói cần giám khảo. `SKILLS` không có `SPEAKING`. |
| Chấm ESSAY | Ngoài phạm vi v1. `isCorrect = null`, loại khỏi tổng điểm. |
| Cron nhắc lịch ôn | Bảng `Reminder` đã chạy, thiếu tiến trình định kỳ |
| Test tự động | Chưa có runner. Thay bằng hai script `check:*` ở trên. |
| Dịch Kho đề | Chưa chốt hướng — xem "Ba ngôn ngữ" ở trên |

`plan.md` ghi một lỗi **chưa sửa**: danh sách "Bài đã làm" có thể trống khi tải lại trang.
Sáu chỗ đọc dữ liệu dùng mẫu `userId ? {userId} : {guestId}` loại trừ nhau.

## Trước khi phát hành

⚠️ **Font Helvetica Neue trong `app/fonts/` không có giấy phép webfont.** Đây là bản việt
hoá lưu hành tự do, không phải bản Monotype. Chạy nội bộ thì được; ra ngoài phải mua giấy
phép hoặc thay bằng Inter / Be Vietnam Pro / Archivo.

⚠️ **Ảnh tầng game là hotlink bên thứ ba** (`components/game/image-manifest.json`).

Cờ quốc gia (`public/fonts/TwemojiCountryFlags.woff2`) thì sạch: CC-BY-4.0 từ Twemoji, cho
dùng thương mại, chỉ cần giữ dòng credit trong `globals.css`.

## Bẫy đã mất thời gian

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
