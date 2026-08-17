import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Mở kênh `react@experimental` cho thư mục `app` — CHỈ để có
   * `<ViewTransition>` (dùng ở trang giới thiệu và Tổng quan).
   *
   * Tài liệu Next nói View Transitions chạy không cần cấu hình, nhưng đó là mô
   * tả kênh canary. Bản React đang cài ở đây là 19.2.8 ổn định và nó KHÔNG export
   * `ViewTransition` — `node -e "console.log(typeof require('react').ViewTransition)"`
   * trả về `undefined`, và import thẳng sẽ nổ "Element type is invalid" lúc chạy
   * chứ không phải lúc biên dịch.
   *
   * Next quyết định kênh React qua đúng một hàm: `needsExperimentalReact()` ở
   * `node_modules/next/dist/lib/needs-experimental-react.js`. Nó bật kênh thử
   * nghiệm khi thấy MỘT trong bốn cờ `blockingSSR` / `taint` /
   * `transitionIndicator` / `gestureTransition`. Không có cờ nào tên
   * `viewTransition` trong bản này — đã tra config-schema.
   *
   * Chọn `taint` vì trong bốn cờ đó nó là cờ DUY NHẤT không đổi hành vi lúc chạy:
   * nó chỉ thêm mấy hàm `experimental_taint*` mà dự án không gọi tới.
   *   • `blockingSSR` đổi cách React vẽ lần đầu (giữ paint bằng `<link rel=expect>`)
   *   • `transitionIndicator` tự vẽ thêm một chỉ báo mỗi lần chuyển trang — chỏi
   *     thẳng với hiệu ứng trượt mà ta đang tự dựng
   *   • `gestureTransition` mở API điều hướng theo cử chỉ, rộng hơn nhu cầu
   *
   * Bỏ dòng này đi thì trang giới thiệu và Tổng quan sẽ nổ lúc chạy, không phải
   * chỉ mất hiệu ứng.
   */
  experimental: {
    taint: true,
  },

  async redirects() {
    return [
      // "Thư giãn" đổi tên thành "Tiện ích" — giữ link cũ còn dùng được
      { source: '/thu-gian', destination: '/tien-ich', permanent: true },
    ]
  },
};

export default nextConfig;
