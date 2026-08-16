# Tạo Google OAuth client

Một OAuth client duy nhất dùng cho cả hai việc:

- **F6** — đăng nhập bằng Google
- **F5** — kết nối Google Calendar để **đọc** giờ trống mà gợi ý lịch ôn

Scope của F5 là `calendar.readonly`, và code chỉ gọi đúng endpoint `freeBusy` —
endpoint này trả về mốc bận/rảnh chứ không trả tiêu đề hay nội dung sự kiện. App
không tạo, sửa hay xoá gì trong lịch người dùng.

Toàn bộ miễn phí, không cần thẻ, không cần domain, không cần deploy.

---

## 1. Tạo project

[console.cloud.google.com](https://console.cloud.google.com) → chọn project ở thanh trên →
**New Project** → đặt tên (vd `on-thi-online`) → **Create**.

## 2. Bật Google Calendar API

**APIs & Services → Library** → tìm `Google Calendar API` → **Enable**.

Chỉ cần cho F5. Đăng nhập Google (F6) không cần bật API nào.

## 3. Màn hình xin quyền

**APIs & Services → OAuth consent screen**

> UI mới của Google gọi mục này là **Google Auth Platform**, tách thành
> Branding / Audience / Clients. Vẫn là một chỗ.

| Mục | Giá trị |
|---|---|
| User type | **External** |
| App name | tuỳ ý |
| User support email | email của bạn |
| Developer contact | email của bạn |
| **Audience → Test users** | **thêm chính Gmail bạn sẽ dùng để test** |

### ⚠️ Giới hạn của chế độ Testing

App chưa được Google duyệt thì đứng ở trạng thái **Testing**, và
**refresh token hết hạn sau 7 ngày**.

- Với **F6** (đăng nhập): không ảnh hưởng, người dùng chỉ cần đăng nhập lại.
- Với **F5** (Calendar): cứ 7 ngày phải bấm kết nối lại. `getConnection` trong
  `lib/calendar/google.ts` xử lý sẵn: refresh thất bại thì tắt `syncEnabled` và
  trang `/lich-on` hiện "Kết nối đã dừng" kèm nút cấp quyền lại, thay vì thử lại
  vô hạn hoặc hỏng ngầm.

Muốn bỏ giới hạn phải submit app cho Google review. Không cần khi đang dev.

## 4. Tạo OAuth client

**Credentials → Create credentials → OAuth client ID**

- Application type: **Web application**
- Authorized JavaScript origins:

```
http://localhost:3000
```

- Authorized redirect URIs — **thêm cả hai dòng**:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/calendar/callback
```

| URI | Dùng cho |
|---|---|
| `/api/auth/callback/google` | F6 — đăng nhập (đường dẫn do Auth.js quy định, không đổi được) |
| `/api/calendar/callback` | F5 — kết nối Calendar |

Sai một ký tự → Google trả `redirect_uri_mismatch`. Không có dấu `/` ở cuối.

**Create** → Google hiện Client ID và Client Secret.

## 5. Dán vào `.env`

```bash
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

`AUTH_SECRET` và `ENCRYPTION_KEY` do script trong repo sinh, không lấy từ Google:

```bash
npm run gen:secrets
```

Khởi động lại dev server sau khi sửa `.env`.

---

## Khi deploy lên domain thật

Thêm (không xoá dòng localhost, để vẫn dev được):

```
https://<domain>/api/auth/callback/google
https://<domain>/api/calendar/callback
```

Và đặt `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` trỏ tới domain đó.

---

## Chưa cấu hình thì sao?

App vẫn chạy bình thường:

- Đăng ký / đăng nhập bằng **email + mật khẩu** hoạt động đầy đủ.
- Nút "Đăng nhập bằng Google" và thẻ kết nối Calendar hiện trạng thái
  **"chưa cấu hình"** kèm link tới file này, thay vì lỗi khó hiểu.

## Lỗi hay gặp

| Lỗi | Nguyên nhân |
|---|---|
| `redirect_uri_mismatch` | URI trong Console khác URI app gửi lên. So từng ký tự, kể cả cổng và dấu `/` cuối. |
| `access_blocked` / app chưa được xác minh | Chưa thêm Gmail của bạn vào **Test users**. |
| `invalid_client` | Client ID/Secret dán thiếu ký tự, hoặc quên khởi động lại dev server. |
| Calendar trả 403 | Chưa **Enable** Google Calendar API ở bước 2. |
