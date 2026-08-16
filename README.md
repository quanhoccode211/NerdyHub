# Nerdy Hub — Kho đề & Thi thử Trực tuyến

Bản dựng theo `SPEC.md`. Giao diện lấy theo bản dựng Dribbble "Online Learning Dashboard"
(file tham chiếu: `../index.html`).

Đợt build này làm **xương sống F1 → F2 → F3 → F4**: kho đề → phòng thi → chấm điểm →
kết quả & thống kê. F5 (Calendar), F6 (Auth/NĐ 13), F8 (Admin CMS) chưa làm — xem
[Chưa có trong đợt này](#chưa-có-trong-đợt-này).

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
  scoring/         Strategy theo từng kỳ thi + engine chấm dùng chung
  attempt-service  Nạp nội dung đề, lọc đáp án khi bài chưa nộp
  queries          Truy vấn nội dung công khai (đã áp content filter)
components/
  exam-room/       Store, sync 3 lớp, highlight engine, timer, review
```

### Hai bất biến quan trọng nhất

**1. Không lộ nội dung không được phép.** `provenance.canPublish = false` chặn ở mọi lối
ra, kể cả khi `status = PUBLISHED`. Seed cố tình có một đề như vậy để kiểm chứng:

```bash
npm run check:content-filter
```

Kiểm tra 4 lối vào: trang chi tiết, gọi thẳng `POST /api/attempts`, sitemap, danh sách đề.

**2. Không lộ đáp án khi đang làm bài.** `loadExamRoom()` chỉ đính `isCorrect` /
`explanation` / `transcript` khi attempt **thực sự** đã `SUBMITTED` — tham số `revealAnswers`
truyền vào không đủ để mở khoá.

---

## Phòng thi (F2)

- **Đồng hồ tính ở server.** `expiresAt` lưu trong DB; client đếm bằng `performance.now()`
  (đồng hồ đơn điệu) nên đổi giờ hệ thống không kéo dài được thời gian. Mỗi lần sync
  thành công, mốc được đặt lại theo server.
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

## Chưa có trong đợt này

| | Ghi chú |
|---|---|
| F5 — Kế hoạch ôn + Google Calendar | Bảng `StudyPlan`, `Reminder`, `CalendarConnection` đã có trong schema. Thiếu OAuth, mã hoá token AES-256-GCM, cron. |
| F6 — Auth.js, xác minh tuổi, consent | Bảng `User`, `Consent` đã có. Hiện chạy ở chế độ khách qua cookie `guest_id`. |
| F8 — Admin CMS | Chưa có. Nhập đề hiện qua `prisma/seed-data.ts`. |
| Chấm ESSAY / SPEAKING | Ngoài phạm vi v1 theo SPEC. Đánh `isCorrect = null`, loại khỏi tổng điểm, hiển thị rõ. |
| Test tự động (Vitest/Playwright) | Chưa viết. Đã verify thủ công end-to-end qua trình duyệt. |

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
