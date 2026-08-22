# Plan — mất dữ liệu "Bài đã làm" khi tải lại trang

## Triệu chứng

Cùng một tài khoản đang đăng nhập, mở `/bai-lam` thấy danh sách bình thường, **tải lại
trang thì trống rỗng** ("Chưa có bài nào được nộp"). Không phải mất vĩnh viễn theo cảm
nhận của người dùng — có lúc lại hiện ra.

Trang cũng đang ghi phụ đề sai: *"Toàn bộ lượt làm bài trong phiên trình duyệt này"* —
câu đó chỉ đúng với khách vãng lai, không đúng với người đã đăng nhập.

## Vì sao đây là lỗi NGHIÊM TRỌNG

Nguyên tắc bất biến số 5 của dự án: không bao giờ để người dùng mất bài làm. Dữ liệu
gần như chắc chắn vẫn nằm nguyên trong DB — cái sai là **truy vấn đọc bằng danh tính
nào**. Nhưng người dùng không phân biệt được hai chuyện đó: với họ, bài đã biến mất.

---

## Nghi phạm số 1 — danh tính "nhảy" giữa userId và guestId

Sáu chỗ đọc dữ liệu đều dùng đúng một mẫu:

```ts
const owner = userId ? { userId } : guestId ? { guestId } : null
```

| File | Dòng |
|---|---|
| `app/(app)/bai-lam/page.tsx` | 21 |
| `app/(app)/dashboard/page.tsx` | 93 |
| `lib/dashboard.ts` | 32, 113, 204 |
| `lib/results.ts` | 205 |

Mẫu này **loại trừ nhau**: đã đăng nhập thì CHỈ đọc theo `userId`, không bao giờ đọc
theo `guestId`. Suy ra hai kịch bản mất dữ liệu:

1. **Lượt thi mồ côi.** Lượt tạo lúc chưa đăng nhập mang `guestId`, `userId = null`.
   `claimGuestData` chỉ chuyển chúng **tại thời điểm đăng nhập**. Nếu cookie `guest_id`
   bị xoá/đổi trước khi đăng nhập, hoặc `claimGuestData` chạy khi chưa có cookie, thì
   các lượt đó vĩnh viễn không ai đọc tới.
2. **Session chập chờn.** Nếu `auth()` có request trả session, request sau trả `null`,
   thì `owner` nhảy giữa `{userId}` và `{guestId}` — đúng triệu chứng "refresh là mất,
   refresh nữa lại có".

Kịch bản 2 đáng ngờ nhất vì khớp với "tải lại trang".

### Cần kiểm chứng trước tiên

- Trong `getIdentity()` (`lib/session.ts:44`), log `userId` và `guestId` qua vài lần
  tải liên tiếp **cùng một tài khoản**. Nếu `userId` lúc có lúc không → đúng kịch bản 2.
- Đối chiếu DB: `SELECT id, userId, guestId, status FROM Attempt` — xem các lượt "biến
  mất" đang mang `userId` nào, hay `userId` là null với `guestId` cũ.

---

## Nghi phạm số 2 — callback `jwt` huỷ phiên nhầm

`auth.ts` (đợt sửa M3) giờ **đối chiếu DB ở MỌI lần đọc phiên** và trả `null` khi không
tìm thấy user:

```ts
const db = await prisma.user.findUnique({ where: { id: token.sub }, ... })
if (!db || db.deletedAt) return null
```

Trả `null` là huỷ phiên. Nếu truy vấn này **ném lỗi** (SQLite khoá file, timeout, hết
kết nối) thay vì trả null, hoặc nếu `token.sub` rỗng ở một nhánh nào đó, phiên sẽ mất
ngay giữa chừng → `owner` rơi về `guestId` → danh sách trống. Tải lại lần nữa, truy vấn
thành công, danh sách hiện lại.

Đây là hồi quy do chính đợt sửa M3 gây ra, cần soi kỹ.

### Cần kiểm chứng

- Bọc `try/catch` quanh truy vấn đó và log; xem có lần nào ném lỗi không.
- Phân biệt rõ hai trường hợp: **"user không tồn tại"** (đúng, phải huỷ phiên) và
  **"không đọc được DB"** (sai, phải GIỮ phiên). Bản hiện tại gộp cả hai.

---

## Nghi phạm số 3 — seed xoá lượt làm bài

`prisma/seed.ts` vẫn `deleteMany()` toàn bộ `Attempt` mỗi lần chạy (cố ý — attempt trỏ
tới các đề sắp dựng lại với id mới). Sau đợt sửa M8, tài khoản được giữ nhưng **lượt làm
bài thì không**.

Nếu người dùng gặp triệu chứng ngay sau một lần `npm run db:seed` thì đây là lời giải,
và không phải bug. Cần loại trừ nghi phạm này trước khi đào sâu hai cái trên.

---

## Hướng sửa đề xuất

**Bước 1 — đọc theo CẢ HAI danh tính, không loại trừ nhau.** Thay mẫu `owner` bằng một
helper dùng chung:

```ts
// lib/session.ts
export function ownerFilter(userId: string | null, guestId: string | null) {
  const or = []
  if (userId) or.push({ userId })
  if (guestId) or.push({ guestId })
  return or.length ? { OR: or } : null
}
```

Người đã đăng nhập vẫn thấy các lượt khách chưa kịp gộp, thay vì chúng biến mất không
dấu vết. Sáu chỗ ở trên đổi sang gọi helper này.

⚠️ **Cẩn thận với quyền riêng tư:** `ownsAttempt` (`lib/session.ts:68`) cố ý KHÔNG rơi
xuống nhánh khách khi lượt đã gắn tài khoản — đó là bản vá lỗi A2 (máy dùng chung, người
sau đọc được bài người trước). Sửa ở đây **không được** làm hỏng tính chất đó: helper mới
chỉ dùng cho các trang DANH SÁCH của chính chủ, còn trang chi tiết vẫn phải qua
`ownsAttempt`. Thêm một khẳng định vào `scripts/check-exam-flow.ts` để chốt điều này.

**Bước 2 — gộp lượt khách một cách bền bỉ.** `claimGuestData` hiện chỉ chạy trong callback
`jwt` lúc đăng nhập. Cân nhắc gọi thêm ở `/bai-lam` và `/dashboard` (idempotent sẵn, chỉ
tốn một `updateMany` khi thật sự có gì để gộp).

**Bước 3 — `jwt` phân biệt "không có user" với "không đọc được DB".** Chỉ trả `null` ở
trường hợp đầu; trường hợp sau giữ nguyên token và để request đi tiếp.

**Bước 4 — sửa phụ đề `/bai-lam`.** "Toàn bộ lượt làm bài trong phiên trình duyệt này"
chỉ đúng với khách; người đã đăng nhập phải thấy câu khác.

---

## Kiểm chứng sau khi sửa

Thêm vào `scripts/check-exam-flow.ts`:

- Lượt gắn `userId` phải hiện trong danh sách của chính user đó, kể cả khi cookie khách
  đã đổi.
- Lượt gắn `guestId` và `userId = null` vẫn hiện cho đúng cookie đó.
- **Không** rò rỉ: lượt của user A không được lọt vào danh sách của user B, và không được
  lọt vào phiên khách sau khi A đăng xuất (giữ nguyên tính chất của bản vá A2).

Trong trình duyệt: đăng nhập → làm một đề → nộp → **tải lại `/bai-lam` năm lần liên
tiếp**, danh sách phải giữ nguyên cả năm lần.
