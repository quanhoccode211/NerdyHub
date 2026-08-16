import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // "Thư giãn" đổi tên thành "Tiện ích" — giữ link cũ còn dùng được
      { source: '/thu-gian', destination: '/tien-ich', permanent: true },
    ]
  },
};

export default nextConfig;
