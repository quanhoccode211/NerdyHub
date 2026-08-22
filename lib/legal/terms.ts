/**
 * Điều khoản sử dụng — nguồn duy nhất.
 *
 * Dùng chung cho popup lúc đăng ký và trang công khai /dieu-khoan, để hai nơi
 * không bao giờ lệch nội dung.
 *
 * ĐỔI NỘI DUNG THÌ PHẢI TĂNG `TERMS_VERSION`. Người dùng đã đồng ý bản cũ sẽ
 * được nhận diện qua `User.termsVersion` để xin đồng ý lại.
 */

/*
  Tăng lên 'c' vì mục 4 là NỘI DUNG MỚI và nó mở rộng phạm vi đồng ý: hai mục
  đích trước đây hỏi bằng ô tích riêng nay nằm trong chính điều khoản. Người đã
  đồng ý bản 'b' chưa hề đọc phần đó, nên `User.termsVersion` phải phân biệt
  được để còn xin đồng ý lại.
*/
export const TERMS_VERSION = '2026-08-17c'
export const TERMS_EFFECTIVE_DATE = '17/08/2026'

export type TermsSection = {
  id: string
  heading: string
  /** Đoạn văn thường */
  paragraphs?: string[]
  /** Gạch đầu dòng */
  bullets?: string[]
  /** Ô nhấn mạnh — dùng cho điều khoản dễ gây hiểu nhầm */
  callout?: string
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'dich-vu',
    heading: '1. Dịch vụ này là gì',
    paragraphs: [
      'Nerdy Hub là kho đề và môi trường thi thử trực tuyến. Chúng tôi cung cấp đề thi, đồng hồ bấm giờ mô phỏng phòng thi thật, chấm điểm tự động và phân tích kết quả.',
    ],
    bullets: [
      'Chúng tôi KHÔNG phải nền tảng dạy học, không có lớp học trực tuyến, không có gia sư và không tổ chức giảng dạy dưới bất kỳ hình thức nào.',
      'Chúng tôi KHÔNG bán lời giải và KHÔNG phải diễn đàn hỏi đáp.',
      'Toàn bộ đề thi hiện có đều miễn phí. Chúng tôi không đặt nội dung đề sau tường phí hay sau đăng nhập.',
    ],
    callout:
      'Vì không có hoạt động dạy học, dịch vụ không thuộc phạm vi điều chỉnh của Thông tư 29/2024/TT-BGDĐT về dạy thêm, học thêm.',
  },
  {
    id: 'tai-khoan',
    heading: '2. Tài khoản và độ tuổi',
    bullets: [
      'Bạn có thể làm bài mà không cần tài khoản. Tài khoản chỉ dùng để lưu tiến độ lâu dài.',
      'Khi đăng ký, bạn phải cung cấp ngày sinh chính xác. Đây là yêu cầu bắt buộc theo Nghị định 13/2023/NĐ-CP để xác minh độ tuổi.',
      'Nếu bạn dưới 16 tuổi, chúng tôi cần email của cha mẹ hoặc người giám hộ và sẽ gửi thư xin xác nhận. Trong lúc chờ, bạn vẫn làm bài và xem kết quả bình thường, nhưng tài khoản sẽ không xuất hiện trên bảng xếp hạng công khai và không nhận email tiếp thị.',
      'Bạn chịu trách nhiệm giữ bí mật mật khẩu của mình và mọi hoạt động diễn ra dưới tài khoản của bạn.',
      'Mỗi người chỉ nên có một tài khoản. Chúng tôi có thể khoá tài khoản dùng thông tin giả mạo.',
    ],
  },
  {
    id: 'du-lieu',
    heading: '3. Dữ liệu cá nhân của bạn',
    paragraphs: [
      'Chúng tôi xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Mỗi mục đích được ghi nhận riêng và bạn bật hoặc tắt được từng mục bất cứ lúc nào trong phần Cài đặt.',
    ],
    bullets: [
      'Bắt buộc: dữ liệu phục vụ vận hành dịch vụ (lưu bài làm, chấm điểm, khôi phục phiên thi). Không có mục này thì dịch vụ không hoạt động được.',
      'Hỏi riêng trên form đăng ký: email tiếp thị. Mặc định TẮT.',
      'Hỏi đúng lúc dùng: kết nối Google Calendar. Chỉ được ghi nhận khi bạn tự bấm kết nối trong mục Lịch ôn và cấp quyền ở màn hình của Google.',
      'Bạn có quyền xuất toàn bộ dữ liệu cá nhân của mình dưới dạng tệp JSON bất cứ lúc nào.',
      'Bạn có quyền yêu cầu xoá tài khoản. Tài khoản bị vô hiệu ngay lập tức và toàn bộ dữ liệu bị xoá vĩnh viễn sau 48 giờ. Trong 48 giờ đó bạn có thể đổi ý.',
      'Bạn có quyền rút lại sự đồng ý cho từng mục đích tuỳ chọn bất cứ lúc nào trong phần Cài đặt.',
    ],
    callout:
      'Chúng tôi không bán dữ liệu cá nhân của bạn cho bên thứ ba và không hiển thị quảng cáo.',
  },
  {
    id: 'dong-y-kem-dieu-khoan',
    heading: '4. Hai mục đích bạn đồng ý khi chấp nhận điều khoản này',
    paragraphs: [
      'Ngoài các mục đích ở phần 3, việc bấm đồng ý với điều khoản này đồng thời là sự đồng ý cho hai mục đích dưới đây. Chúng được mô tả tại đây thay vì hỏi bằng ô tích riêng trên form đăng ký.',
    ],
    bullets: [
      'Phân tích sử dụng: chúng tôi thống kê cách sản phẩm được dùng — đề nào hay được làm, câu nào nhiều người sai, phòng thi bị bỏ dở ở đâu — để cải thiện chất lượng đề và trải nghiệm. Số liệu này ở dạng tổng hợp, không dùng để nhận dạng cá nhân bạn và không được chia sẻ ra ngoài.',
      'Hiển thị tên trên bảng xếp hạng: tên bạn có thể xuất hiện công khai khi hệ thống so sánh thành tích giữa những người cùng làm một đề. Chỉ hiển thị tên bạn đã đặt trong hồ sơ — không hiển thị email, ngày sinh hay bài làm chi tiết.',
    ],
    callout:
      'Bạn TẮT được cả hai mục này bất cứ lúc nào trong Cài đặt mà vẫn dùng dịch vụ bình thường — chúng không phải điều kiện để có tài khoản. Người dùng dưới 16 tuổi chưa có xác nhận của người giám hộ thì mục hiển thị tên công khai luôn ở trạng thái tắt, kể cả khi đã đồng ý điều khoản.',
  },
  {
    id: 'noi-dung',
    heading: '5. Nội dung đề thi và bản quyền',
    bullets: [
      'Mỗi bộ đề trên hệ thống đều ghi rõ nguồn gốc và giấy phép sử dụng. Nguồn được hiển thị công khai ngay trên trang của đề đó.',
      'Đề do cơ quan nhà nước công bố công khai, nội dung thuộc phạm vi công cộng, hoặc nội dung do chúng tôi tự biên soạn — bạn được sử dụng để ôn luyện cá nhân.',
      'Bạn KHÔNG được sao chép hàng loạt, thu thập tự động (scraping), phân phối lại hoặc bán lại nội dung đề thi.',
      'Ghi chú và phần tô sáng bạn tạo ra trong lúc làm bài thuộc về bạn. Chúng tôi chỉ lưu để phục vụ việc bạn xem lại.',
    ],
    callout:
      'Nếu bạn là chủ sở hữu quyền tác giả và cho rằng nội dung nào đó vi phạm, hãy liên hệ với chúng tôi. Chúng tôi lưu thông tin nguồn gốc của từng câu hỏi nên có thể gỡ bỏ chính xác phần liên quan.',
  },
  {
    id: 'phong-thi',
    heading: '6. Quy tắc phòng thi',
    bullets: [
      'Thời gian làm bài được tính ở máy chủ. Thay đổi giờ trên thiết bị của bạn không kéo dài được thời gian thi.',
      'Ở chế độ Thi thật, phần nghe chỉ phát một lần và không tua được — đúng như điều kiện thi thật. Chọn chế độ Luyện tập nếu bạn muốn nghe lại.',
      'Hết giờ, bài được tự động nộp.',
      'Bài làm được lưu tự động nhiều lớp. Nếu mất mạng, bạn vẫn làm tiếp được và dữ liệu sẽ tự gửi lại khi có mạng.',
      'Bạn không được dùng công cụ tự động, kịch bản hay bất kỳ cách nào can thiệp vào quá trình làm bài và chấm điểm.',
    ],
  },
  {
    id: 'gioi-han',
    heading: '7. Giới hạn trách nhiệm',
    bullets: [
      'Điểm số trên hệ thống là kết quả luyện tập mang tính tham khảo. Đây KHÔNG phải điểm thi chính thức và không có giá trị thay thế kết quả của kỳ thi thật.',
      'Chúng tôi cố gắng bảo đảm nội dung chính xác nhưng không cam kết đề thi trên hệ thống trùng khớp với đề thi thật.',
      'Chúng tôi không chịu trách nhiệm cho quyết định học tập, chọn trường hay đăng ký dự thi mà bạn đưa ra dựa trên kết quả tại đây.',
      'Dịch vụ có thể tạm ngưng để bảo trì. Chúng tôi cố gắng báo trước khi có thể.',
    ],
  },
  {
    id: 'thay-doi',
    heading: '8. Thay đổi điều khoản',
    paragraphs: [
      'Khi điều khoản thay đổi ở mức ảnh hưởng tới quyền lợi của bạn, chúng tôi sẽ thông báo và xin lại sự đồng ý trước khi bạn tiếp tục sử dụng dịch vụ. Mỗi bản điều khoản đều có số phiên bản và ngày hiệu lực ghi ở đầu tài liệu.',
      'Bạn có thể ngừng sử dụng dịch vụ và xoá tài khoản bất cứ lúc nào nếu không đồng ý với bản cập nhật.',
    ],
  },
]

/** Tóm tắt hiển thị ở đầu popup — cho người không đọc hết vẫn nắm được ý chính. */
export const TERMS_HIGHLIGHTS = [
  'Đề thi miễn phí, không quảng cáo, không bán dữ liệu của bạn.',
  'Dưới 16 tuổi cần xác nhận của cha mẹ hoặc người giám hộ.',
  'Xoá tài khoản là xoá thật — sạch dữ liệu sau 48 giờ.',
  'Điểm ở đây là điểm luyện tập, không phải điểm thi chính thức.',
]
