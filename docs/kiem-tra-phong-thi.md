# Kiểm tra phòng thi — báo cáo lỗi

Rà soát toàn bộ luồng làm bài: tạo lượt thi → phòng thi → đồng bộ → nộp → chấm →
trang kết quả → xem lại.

Ngày rà: 15/08/2026.

## Tiến độ sửa

**Đợt 1 (16/08/2026) — ĐÃ SỬA:** A1, A2, A3, A4, A5, A6, A7, A10, B6, và mục
"Khôi phục lượt thi bỏ qua `mode`" + "`prisma.$transaction` lúc nộp không có lưới
đỡ" + "`keepalive` âm thầm hỏng khi batch lớn" ở nhóm D. B8 cũng xong theo.

Hai lỗi phát hiện thêm trong lúc sửa, không có trong bản khảo sát gốc:

- **M1 — đồng hồ Luyện tập tụt về mốc cũ sau MỖI LẦN sync**, không chỉ khi tải
  lại. `readClock()` (`store.ts`) tính giờ bằng hiệu `elapsedAtRef`/`monotonicRef`,
  còn `markSynced` đặt lại `monotonicRef` mà không dời `elapsedAtRef` — trong khi
  route sync trả `remainingSeconds` cho cả hai chế độ. Nặng hơn B6. Đã sửa.
- **M2 — debounce không bắn khi sửa lại cùng một câu.** Subscription so sánh *số
  lượng* pending, mà `dirtyAnswers` là `Set` id nên size không đổi. Một mình thì
  vô hại; cộng với A3 là mất dữ liệu thật. Đã sửa bằng bộ đếm `dirtyVersion`.

**Còn lại:** B1–B5, B7 (số liệu sai) · A8, A9, A11, A12 (chân thực chế độ thi
thật) · C1–C7 (điều hướng, a11y) · phần còn lại nhóm D.

**Cố ý để lại:** cưỡng chế hết giờ ở phía server. Tiêu thụ cờ `expired` chỉ sửa
được client tử tế; sửa triệt để phải đóng lượt thi ở server, kéo theo quyết định
chấm ngay trên đường autosave hay tách job riêng.

Mỗi mục ghi rõ **triệu chứng người dùng thấy** trước, rồi mới tới nguyên nhân
trong code — để quyết định ưu tiên theo tác động chứ không theo độ khó kỹ thuật.

---

## A. Mất dữ liệu và sai quyền sở hữu

### A1. Lượt thi của người đã đăng nhập không gắn vào tài khoản
**Nặng nhất trong danh sách.**

*Triệu chứng*: đăng nhập, làm một đề, nộp bài. Vào "Bài đã làm" — trống. Vào
"Thống kê" — không có gì thay đổi, chuỗi ngày học và biểu đồ tiến độ đều bỏ qua
bài vừa làm. Xoá cookie trình duyệt là mất vĩnh viễn, dù người dùng có tài khoản.

*Nguyên nhân*: `app/api/attempts/route.ts:51-59` tạo `Attempt` chỉ với `guestId`;
`userId` không bao giờ được ghi, và route này không hề gọi `auth()`.
`claimGuestData` (`lib/auth/claim-guest.ts:26-29`) chỉ chuyển những lượt thi đã tồn
tại **tại thời điểm đăng nhập**, nên mọi lượt thi tạo *sau* đó vĩnh viễn có
`userId: null`.

Hệ quả lan ra vì cả hai chỗ đọc đều ưu tiên `userId`:
`app/(app)/bai-lam/page.tsx:21` và `lib/results.ts:144` cùng dùng
`const where = userId ? { userId } : { guestId }`.

### A2. Đăng xuất không xoá danh tính khách
*Triệu chứng*: máy dùng chung. Người A đăng xuất, người B mở "Bài đã làm" — vẫn
thấy bài của người A, và mở được trang kết quả của họ.

*Nguyên nhân*: `app/actions/sign-out.ts` chỉ gọi `signOut`. Cookie `guest_id`
(`lib/session.ts:10, 26-32`, hạn 1 năm) còn nguyên, mà `claimGuestData` không xoá
`guestId` khỏi các lượt đã nhận. `ownsAttempt` (`lib/session.ts:58-60`) rơi về
nhánh khách khi `ctx.userId` là null → mở được.

### A3. Autosave kẹt vĩnh viễn khi một request chậm
*Triệu chứng*: chỉ báo "Chờ lưu…" đứng mãi không đổi. Đáp án đã trả lời không lên
server cho tới khi người dùng tình cờ sửa một câu khác, hoặc chuyển tab, hoặc nộp
bài. Mạng yếu là gặp.

*Nguyên nhân*: `components/exam-room/use-sync.ts:26` —
`if (pending === 0 || inFlightRef.current) return`: gặp request đang bay thì thoát
**mà không hẹn lại lịch**. Còn subscription ở `use-sync.ts:96-105` chỉ đặt hẹn giờ
khi *số lượng* pending thay đổi (`pending === prevPending` thì bỏ qua). Nên nhánh
thoát ở dòng 26 là một ngõ cụt: không ai gửi lại.

### A4. Vòng lặp retry vô hạn khi server trả 409 hoặc 429
*Triệu chứng*: hết giờ, hoặc mở đề ở hai tab. Chỉ báo chuyển "Lỗi lưu, đang thử
lại" và ở đó mãi. Người dùng không rời trang được vì cảnh báo `beforeunload` bật
liên tục.

*Nguyên nhân*: `app/api/attempts/[id]/sync/route.ts:35-37` trả 409 khi trạng thái
không còn `IN_PROGRESS`. `use-sync.ts:72-76` gộp **mọi** phản hồi không `ok` vào
một nhánh: `requeue(batch)` + `markFailed(false)`. `requeue` đẩy pending từ 0 lên
N, đúng điều kiện kích hoạt lại subscription → 3 giây sau gửi lại → lại 409 → lặp
mãi. Không có backoff, và header `Retry-After` của nhánh 429 bị bỏ qua hoàn toàn.

### A5. Cờ `expired` từ server bị bỏ qua
`app/api/attempts/[id]/sync/route.ts:119-125` trả về `expired` đúng để client
biết đường tự nộp, nhưng `use-sync.ts:78-81` chỉ đọc `remainingSeconds`. Nếu
đồng hồ client sai hoặc auto-submit hỏng, phòng thi vẫn nhận đáp án sau
`expiresAt` — và route sync vẫn ghi hết chúng xuống DB (`sync/route.ts:48` tính
`expired` nhưng vẫn thực thi mọi `ops`).

### A6. Tự nộp khi hết giờ không có cơ chế thử lại
`components/exam-room/exam-room.tsx:100-104`: nộp lỗi thì `alert()` rồi reset
`submittedRef`. Nhưng `firedRef` của `Timer` (`timer.tsx:23, 39-42`) đã là `true`
và không bao giờ được reset. Một cú nghẽn mạng đúng lúc 00:00 nghĩa là bài
**không bao giờ** được tự nộp nữa; thí sinh ngồi ở 00:00 và vẫn trả lời tiếp
(cộng hưởng với A5). `alert()` còn khoá luồng chính.

### A7. Highlight/ghi chú xoá trong 3 giây cuối bị mất
`exam-room.tsx:69-93` lấy `takeDirtyBatch()` nhưng chỉ map `batch.answers` và
`batch.annotations` — `batch.deleted` bị bỏ, trong khi `takeDirtyBatch`
(`store.ts:342`) đã dọn sạch tập đó. `app/api/attempts/[id]/submit/route.ts:68-69`
cũng lọc `!an.deleted` và không xoá gì. Kết quả: highlight vừa xoá xong hiện lại
ở trang xem lại.

### A8. Audio "nghe một lần" bypass được bằng reload
*Triệu chứng*: phần Nghe ở chế độ thi thật, nghe xong, bấm F5 — hiện lại nút
"Bắt đầu nghe", nghe lại được bao nhiêu lần tuỳ thích.

*Nguyên nhân*: `components/exam-room/audio-player.tsx:31-42` — `started`, `ended`
và `allowedTimeRef` chỉ là state của component, không có gì được ghi xuống store
hay server. Reload là mount lại từ đầu. Đây là phá vỡ đúng cam kết cốt lõi của chế
độ thi thật.

### A9. Cùng component, mốc chặn tua bị lẫn giữa hai phần
`exam-room.tsx:259-265` render `<AudioPlayer>` không truyền `key`. Chuyển giữa hai
phần **cùng có audio** thì React tái sử dụng instance: `src` đổi nhưng
`allowedTimeRef` (`audio-player.tsx:41`) còn giữ vị trí của bản ghi trước, nên
`onSeeking` (dòng 56-63) kéo `currentTime` về mốc cũ trên bản ghi mới. `started`
và `ended` cũng cũ → cổng cảnh báo của phần 2 bị bỏ qua sạch.

### A10. Đua giữa sync đang bay và lệnh nộp
`exam-room.tsx:67-69` — `await flush()` trả về ngay lập tức nếu đã có sync đang bay
(chính nhánh A3), rồi `takeDirtyBatch()` gom phần còn lại và nộp. Nếu request đang
bay sau đó *hỏng*, `requeue` (`store.ts:367-381`) đẩy các đáp án đó về một store
giờ đã ở trạng thái `submitted` — chúng không bao giờ được gửi, mà bài thì đã chấm.

### A11. Bản nháp sessionStorage ghi đè theo kiểu "ai ghi sau thắng"
`store.ts:110` có ghi `savedAt`, nhưng `readLocal` (119-134) không đọc tới, và
bước merge (185-197) ghi đè giá trị từ server bất cứ khi nào `differs`. Hai tab
cùng một lượt thi (sessionStorage riêng từng tab, server thì chung) → tab cũ mở
lại sẽ đè bản nháp cũ lên đáp án mới của tab kia.

### A12. Tự chấm phía server không dọn bản nháp local
`clearLocal` chỉ được gọi ở đường nộp từ client (`exam-room.tsx:98`). Khi trang
phòng thi tự chấm một lượt đã hết hạn
(`app/(exam)/thi/[attemptId]/page.tsx:42-45`), khoá `exam-room:<id>` vẫn còn.
`ReviewView` gọi đúng hàm `hydrate` đó (`review-view.tsx:30-32`) và merge bản nháp
cũ lên đáp án đã chấm — trang `/ket-qua/[id]/xem-lai` hiện lựa chọn chưa từng được
chấm, ngay cạnh nhãn đỏ "Sai" tính từ dữ liệu server.

---

## B. Số liệu hiển thị sai

### B1. Đồng hồ dư đúng 30 giây, nhìn thấy được
`app/api/attempts/route.ts:48-49` cộng `BUFFER_SEC = 30` vào `expiresAt`, còn
`lib/attempt-service.ts:157-160` lấy `remainingSeconds` thẳng từ `expiresAt`. Mở
một đề 60 phút thì đồng hồ chạy từ **60:30**. Khoảng đệm này đáng ra là dung sai
phía server, không phải phần hiển thị cho thí sinh.

### B2. Câu chỉ gắn cờ mà bỏ trống bị chấm và báo cáo là **SAI**
*Triệu chứng*: gắn cờ một câu để quay lại sau, hết giờ chưa kịp làm. Trang kết quả
đếm nó vào "Sai", liệt kê nó trong danh sách "Câu sai (N)" kèm nội dung, và **không**
tính vào "Bỏ trống". Vòng tròn thống kê ở `ket-qua/page.tsx:207-219` do đó không
cộng lại bằng tổng số câu.

*Nguyên nhân*: gắn cờ tạo một dòng `AttemptAnswer` với danh sách lựa chọn rỗng
(`store.ts:261-264` → upsert khi sync). `lib/scoring/grader.ts:42-45` coi
`noAnswer` là `isCorrect: false`, còn `lib/results.ts:45, 114` tính
`unanswered = totalQuestions - attempt.answers.length` — tức là đếm theo *số dòng*,
nên câu có dòng nhưng rỗng lọt qua khe.

### B3. Mẫu số "N/M câu đúng" sai khi bỏ trống câu tự luận
`app/(app)/ket-qua/[attemptId]/page.tsx:77` dùng `counts.total - counts.ungraded`,
nhưng `counts.ungraded` (`results.ts:47`) chỉ đếm những *dòng* có
`isCorrect === null`. Một câu ESSAY bỏ trống thì không có dòng nào, nên nó thổi
phồng mẫu số so với đúng cái mà bộ chấm đã dùng (`grader.ts:36-38` loại nó khỏi
`totalPoints`).

### B4. Phần trăm xếp hạng 0 mang hai nghĩa trái ngược
`lib/scoring/index.ts:143` trả `0` cho cả "người đầu tiên làm đề này" lẫn "điểm
thấp hơn tất cả mọi người". `ket-qua/page.tsx:84-89` rẽ nhánh theo `percentile > 0`
nên in ra "Bạn là một trong những người đầu tiên làm đề này." cho đúng người làm
tệ nhất. Phần trăm cũng chỉ tính một lần lúc nộp và không bao giờ tính lại, nên
người làm sớm giữ mãi thứ hạng cũ.

### B5. `timeSpent` là thời gian treo máy, không chặn trần
`lib/scoring/index.ts:73-76` lấy khoảng cách từ `startedAt` tới lúc chấm. Đóng tab,
hôm sau mở lại → trang phòng thi tự chấm (`app/(exam)/thi/[attemptId]/page.tsx:42-45`)
và ghi ~24 giờ. Con số này chảy vào "Bạn làm trong X" (`ket-qua/page.tsx:95`), phép
so nhanh/chậm (dòng 99-102), `avgTimeSpent` của mọi người khác (`results.ts:84-87`)
và tổng giờ học ở `/thong-ke`.

### B6. Chế độ luyện tập mất đồng hồ sau mỗi lần tải lại
`store.ts:223` khởi tạo `elapsedAtRef` từ `data.attempt.timeSpent`, nhưng không có
gì ghi giá trị đó: `syncSchema` có hỗ trợ `timeSpent` ở cấp cao nhất
(`lib/api-schemas.ts:39`) và route đã persist (`sync/route.ts:112`), nhưng
`use-sync.ts:32-62` không bao giờ đưa nó vào payload. `markSynced`
(`store.ts:316-327`) cũng chỉ neo lại `remainingAtRef`, không đụng `elapsedAtRef`.

### B7. Nhãn tiến độ ở header trộn hai phạm vi
`exam-room.tsx:195-197` in `{SKILL_LABELS[section.skill]} · {summary.answered}/{summary.total} câu`,
mà `summary` tính trên **toàn bộ** các phần (`store-helpers.ts:28`). Đọc ra thành
"Nghe · 3/120 câu" trong khi phần Nghe chỉ có 30 câu.

### B8. Batch cuối lúc nộp đánh rơi `timeSpent`/`changedCount`
`submit/route.ts:59-65` ở nhánh `update` chỉ ghi `selectedChoiceIds`/`textAnswer`/
`isFlagged`, khác với `sync/route.ts:65-73` vốn ghi cả `timeSpent`/`changedCount`.
Cùng một payload, hai hợp đồng lưu trữ khác nhau.

---

## C. Điều hướng và khả năng tiếp cận

### C1. Không có lối thoát khỏi phòng thi
`app/(exam)/layout.tsx` cố ý bỏ khung ứng dụng, và `ExamRoom` không render nút
"lưu và thoát" nào. Chốt chặn duy nhất là `beforeunload` (`use-sync.ts:131-141`),
mà sự kiện này **không** bắn khi điều hướng nội bộ của Next. Bấm Back của trình
duyệt là rời phòng thi kèm theo mọi thay đổi chưa đồng bộ, không một lời cảnh báo.

### C2. Phím mũi tên chặn cuộn trang
`exam-room.tsx:113-138` gắn keydown ở mức `window` và `preventDefault()` cả bốn
phím mũi tên khi focus không nằm trong `INPUT`/`TEXTAREA`. Người dùng bàn phím
không cuộn được bài đọc dài nữa. Nó cũng không xử lý `contenteditable` và `select`,
và không nhảy qua được ranh giới giữa các phần.

### C3. Đáp án không có viền focus
`components/exam-room/question-view.tsx:120-127`: `<input>` thật là `sr-only` nằm
trong `<label>`, không có `peer`/`focus-within` nào. `globals.css:340-343` có định
nghĩa `:focus-visible` toàn cục nhưng nó vẽ lên một phần tử đã bị cắt còn 1×1 px.
Tab qua một câu hỏi là hoàn toàn không thấy con trỏ ở đâu — trong đúng màn hình mà
`globals.css:339` ghi là phải điều hướng được hoàn toàn bằng bàn phím.

### C4. Modal khai là modal nhưng không hành xử như modal
`review-screen.tsx:31-38` và ngăn kéo câu hỏi trên mobile (`exam-room.tsx:323-350`)
đều khai `role="dialog" aria-modal="true"` nhưng không bẫy focus, không đặt focus
ban đầu, không xử lý Escape, không khoá cuộn nền. Nền của bảng xem lại còn không có
`onClick` nên bấm ra ngoài để đóng lặng lẽ không làm gì.

### C5. Thanh chia đôi màn hình chỉ dùng được bằng chuột
`exam-room.tsx:281-288`: có `role="separator"` và `aria-orientation` nhưng không
`tabIndex`, không xử lý phím mũi tên, không `aria-valuenow`/`valuemin`/`valuemax`.
`onDragStart` (142-158) cũng không gọi `setPointerCapture`, nên kéo nhanh ra ngoài
cửa sổ là mất luôn sự kiện pointerup.

### C6. Link "Xem tất cả N câu sai" hay rơi vào màn hình trống
`ket-qua/page.tsx:192` trỏ tới `?loc=sai`, nhưng `ReviewView` lọc **trong phần đang
chọn**, mà mặc định là `data.sections[0]` (`review-view.tsx:28, 41-49`). Câu sai
nằm ở phần 2 thì người dùng nhận được "Không có câu nào sai trong phần này." Trạng
thái rỗng còn chọn nhầm câu chữ khi `filter === 'all'` (dòng 153-158), và
`useState(initialFilter)` bỏ qua mọi thay đổi `searchParams` sau đó.

### C7. Chiều cao cứng `calc(100vh-190px)`
`exam-room.tsx:273` và `:291`. Chiều cao thật của header thay đổi theo hàng tab
phần thi (dòng 224), `TimeWarningBanner` (dòng 247) và khối hướng dẫn từng phần
(253-257). Khi banner 5 phút cuối hiện ra, header cao thêm ~50px và đáy của cả hai
khung cuộn bị đẩy xuống dưới màn hình, không cách nào với tới.

---

## D. Nhóm nhỏ hơn

- **Không bỏ chọn được đáp án một-lựa-chọn.** `store.ts:250` có viết nhánh bỏ chọn
  (`prev[0] === choiceId ? [] : [choiceId]`), nhưng điều khiển là
  `<input type="radio">` — `onChange` không bắn khi nó đã được chọn
  (`question-view.tsx:121-124`). Nhánh đó là code chết; người dùng không có cách nào
  gỡ câu trả lời.
- **`changedCount` đếm dư.** `store.ts:253` tăng bất cứ khi nào
  `prev.selectedChoiceIds.length > 0`, nên với MULTI_CHOICE thì tick thêm ô thứ hai
  cũng bị tính là "đổi ý".
- **Trang xem lại vẽ viền đỏ lên câu điền từ bỏ trống.** `question-view.tsx:88-90`:
  `result?.isCorrect ? ring-green : ring-red` — nên `isCorrect === null` (chưa chấm)
  và "không có dòng nào" đều hiện thành sai.
- **`expireIfNeeded` là code chết** (`lib/attempt-service.ts:245-255`): không nơi nào
  gọi, và trái với docstring, nó không bao giờ ghi `EXPIRED`. Không chỗ nào trong
  codebase đặt `EXPIRED` hay `ABANDONED` (`lib/enums.ts:110`, `schema.prisma:318`) —
  bài hết hạn trở thành `SUBMITTED`, nên chú thích "loại ABANDONED/EXPIRED" ở
  `scoring/index.ts:134` mô tả một bộ lọc không bao giờ khớp.
- **Hook tiến độ bị nhân đôi.** `question-nav.tsx:99-117` (`useProgressSummary`) là
  bản sao không dùng tới của `store-helpers.ts:25-37`, xử lý null hơi khác.
- **`keepalive: true` âm thầm hỏng khi batch lớn** (`use-sync.ts:34, 69, 124`): trần
  của keepalive là 64 KB, mà `textAnswer` cho phép tới 20 000 ký tự mỗi câu
  (`api-schemas.ts:14`).
- **`prisma.$transaction` lúc nộp không có lưới đỡ** (`submit/route.ts:89`): một
  `annotation.upsert` ném lỗi (ví dụ trùng id từ lượt thi khác — `Annotation.id`
  unique toàn cục, `where` không giới hạn theo `attemptId`) là cả request 500 và
  `scoreAttempt` không bao giờ chạy, dù đáp án hoàn toàn hợp lệ.
- **Câu hỏi bị hạn chế vẫn được phát trong đề hợp lệ.** `lib/content-filter.ts:26-30`
  ghi rõ `Question` mang provenance riêng và "một đề hợp lệ vẫn có thể chứa câu bị
  hạn chế", nhưng `loadExamRoom` (`lib/attempt-service.ts:137-140`) nạp mọi câu
  không qua `publicQuestionFilter()`. Hàm đó hiện không có chỗ gọi nào.
- **Khôi phục lượt thi bỏ qua `mode`.** `app/api/attempts/route.ts:39-45` khớp theo
  `paperId + guestId + IN_PROGRESS`. Đang dở một lượt thi thật mà bấm **Luyện tập**
  thì bị ném ngược vào phòng thi bấm giờ, và ngược lại. Khớp theo `guestId` cũng
  nghĩa là người đã đăng nhập không thể làm tiếp trên máy thứ hai.
- **Đề rỗng là ngõ cụt.** `exam-room.tsx:160-162` hiện đúng một dòng "Đề thi này chưa
  có nội dung." không kèm link nào, mà nhóm route này không có nav. `POST /api/attempts`
  cũng không kiểm tra đề có phần/câu hỏi trước khi tạo lượt thi.

---

## Đề xuất thứ tự xử lý

1. **A1** — sai lệch dữ liệu, càng để lâu càng nhiều lượt thi mồ côi không thể vá
   ngược. Sửa trước tất cả.
2. **A3, A4** — hai lỗi này làm hỏng chính cơ chế chống mất bài, và A4 còn nhốt
   người dùng trong trang.
3. **B2, B1** — người dùng nhìn thấy trực tiếp và làm mất niềm tin vào điểm số.
4. **A8, A9** — phá vỡ cam kết "thi thật" của chế độ EXAM.
5. **C1, C3** — chặn đường và chặn bàn phím.
6. Phần còn lại theo nhóm.
