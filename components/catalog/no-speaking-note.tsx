import { WarningIcon } from '../shell/icons'

/**
 * Ghi chú: đề trên web KHÔNG có phần Nói, và bài thi thật thì có.
 *
 * Vì sao phải nói ra thay vì lặng lẽ bỏ: người dùng luyện đề để ước lượng sức bền
 * cho ngày thi. Một đề 65 phút trong khi phòng thi thật kéo 80 phút là một sai lệch
 * họ chỉ phát hiện ra đúng lúc không sửa được nữa.
 *
 * `minutes` đến từ `Exam.realSpeakingMinutes`, là trường BẮT BUỘC khai khi thêm kỳ
 * thi mới — xem ghi chú ở `SeedExam` trong prisma/seed-data.ts. Kỳ thi vốn không có
 * phần nói thì trường đó là `null` và nơi gọi không render component này.
 */
export function NoSpeakingNote({
  minutes,
  totalDurationSec,
}: {
  minutes: number
  /** Thời lượng đề trên web, để nói luôn tổng thời gian của bài thi thật */
  totalDurationSec: number
}) {
  const realTotal = Math.round(totalDurationSec / 60) + minutes

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-amber-soft p-4 text-[14.5px] leading-relaxed text-amber">
      <span className="mt-0.5 flex-none">
        <WarningIcon size={16} />
      </span>
      <span>
        <strong>Đề này không có phần Nói.</strong> Bài thi thật còn một phần Nói riêng,
        khoảng <strong>{minutes} phút</strong>, tính THÊM ngoài thời lượng ở đây — tổng
        cộng vào khoảng {realTotal} phút. Phần nói cần giám khảo chấm trực tiếp nên
        không dựng lại được trên web; hãy tính cả nó khi bạn ước lượng sức bền cho ngày
        thi.
      </span>
    </div>
  )
}
