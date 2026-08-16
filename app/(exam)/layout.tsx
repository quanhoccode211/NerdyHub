/**
 * Nhóm route phòng thi — cố ý KHÔNG dùng AppShell.
 *
 * Trong phòng thi không được có rail điều hướng: rời khỏi bài đang làm phải là
 * hành động có chủ đích (nút Nộp bài), không phải một cú bấm nhầm vào menu.
 */
export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
