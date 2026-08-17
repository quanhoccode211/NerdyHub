/**
 * Kéo khai báo kiểu của kênh React canary vào dự án — cụ thể là `<ViewTransition>`.
 *
 * `@types/react` để các kiểu này ở một file RIÊNG (`canary.d.ts`) và không nạp
 * mặc định, nên thiếu dòng dưới thì `import { ViewTransition } from 'react'`
 * báo "has no exported member" dù lúc chạy vẫn tốt.
 *
 * Cách chính thức còn lại là thêm `"react/canary"` vào `compilerOptions.types`
 * của tsconfig, nhưng khai `types` là ĐÓNG danh sách: từ lúc đó TypeScript chỉ
 * nạp đúng những gói ghi trong đó, `@types/node` rơi ra ngoài và mọi chỗ dùng
 * `process.env` gãy theo. Triple-slash thì chỉ thêm, không loại trừ gì.
 *
 * Đi kèm `experimental.taint` trong next.config.ts — xem ghi chú ở đó để biết
 * vì sao phải mở kênh thử nghiệm.
 */

/// <reference types="react/canary" />

export {}
