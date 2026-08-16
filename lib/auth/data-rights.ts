// Cố ý KHÔNG dùng `server-only` ở đây: module này còn được các script CLI chạy
// bằng tsx import (job dọn dẹp, script kiểm chứng cam kết xoá), mà `server-only`
// ném lỗi ngay khi nạp ngoài môi trường Next. Nó vốn đã an toàn — chỉ import
// prisma, không có gì để lọt vào bundle client.
import { prisma } from '@/lib/db'
import { parseRecord, parseStringArray } from '@/lib/json-fields'

/**
 * Quyền của chủ thể dữ liệu theo NĐ 13/2023 (SPEC F6).
 *
 *   • Xuất toàn bộ dữ liệu cá nhân
 *   • Xoá tài khoản: soft delete NGAY, hard delete sau 48 GIỜ
 *
 * Cam kết 48 giờ nằm trong chính sách nên phải kiểm chứng được, không thể là
 * lời hứa suông — xem scripts/purge-deleted-users.ts.
 */

export const PURGE_DELAY_HOURS = 48

/** Toàn bộ dữ liệu cá nhân, dạng JSON đọc được. */
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      consents: true,
      accounts: { select: { provider: true, type: true, scope: true } },
      studyPlans: { include: { reminders: true } },
      calendarConn: {
        select: { provider: true, calendarId: true, syncEnabled: true, createdAt: true },
      },
      attempts: {
        include: {
          paper: { select: { title: true, exam: { select: { name: true } } } },
          answers: {
            include: { question: { select: { number: true, content: true } } },
          },
          annotations: true,
        },
      },
    },
  })
  if (!user) return null

  return {
    xuatLuc: new Date().toISOString(),
    ghiChu:
      'Toàn bộ dữ liệu cá nhân gắn với tài khoản của bạn, theo Nghị định 13/2023/NĐ-CP. ' +
      'Mật khẩu và token truy cập đã được loại bỏ vì không phải dữ liệu bạn cung cấp.',

    taiKhoan: {
      id: user.id,
      email: user.email,
      ten: user.name,
      ngaySinh: user.birthDate,
      duoi16Tuoi: user.isMinor,
      coXacNhanGiamHo: user.guardianConsent,
      emailGiamHo: user.guardianEmail,
      vaiTro: user.role,
      taoLuc: user.createdAt,
      yeuCauXoaLuc: user.deletedAt,
      xoaCungSau: user.purgeAfter,
    },

    dangNhapLienKet: user.accounts.map((a) => ({
      nhaCungCap: a.provider,
      loai: a.type,
      phamVi: a.scope,
    })),

    suDongY: user.consents.map((c) => ({
      mucDich: c.purpose,
      dongY: c.granted,
      thoiDiem: c.grantedAt,
      diaChiIp: c.ipAddress,
      trinhDuyet: c.userAgent,
    })),

    ketNoiLich: user.calendarConn
      ? {
          nhaCungCap: user.calendarConn.provider,
          maLich: user.calendarConn.calendarId,
          dangBat: user.calendarConn.syncEnabled,
          ketNoiLuc: user.calendarConn.createdAt,
          ghiChu: 'Access/refresh token được mã hoá và không xuất ra.',
        }
      : null,

    keHoachOn: user.studyPlans.map((p) => ({
      kyThi: p.examId,
      capDoMucTieu: p.targetLevel,
      ngayThi: p.targetDate,
      soDeMoiTuan: p.weeklyGoal,
      gioHoc: p.studyTime,
      nhacNho: p.reminders.map((r) => ({
        loai: r.type,
        kenh: r.channel,
        hen: r.scheduledAt,
        daGui: r.sentAt,
      })),
    })),

    baiLam: user.attempts.map((a) => ({
      id: a.id,
      de: a.paper.title,
      kyThi: a.paper.exam.name,
      cheDo: a.mode,
      trangThai: a.status,
      batDau: a.startedAt,
      nopLuc: a.submittedAt,
      thoiGianLam: a.timeSpent,
      diemThang: a.scaledScore,
      phanTramVuot: a.percentile,
      diemTungKyNang: parseRecord(a.sectionScoresJson),
      dapAn: a.answers.map((ans) => ({
        cauSo: ans.question.number,
        noiDungCau: ans.question.content,
        luaChon: parseStringArray(ans.selectedChoiceIdsJson),
        traLoiChu: ans.textAnswer,
        dung: ans.isCorrect,
        diem: ans.pointsEarned,
        danhDau: ans.isFlagged,
        soLanDoiDapAn: ans.changedCount,
      })),
      ghiChuVaToSang: a.annotations.map((an) => ({
        loai: an.type,
        mau: an.color,
        doanDaChon: an.selectedText,
        ghiChu: an.noteContent,
        taoLuc: an.createdAt,
      })),
    })),
  }
}

/** Soft delete ngay + hẹn xoá cứng sau 48 giờ. */
export async function requestAccountDeletion(userId: string) {
  const now = new Date()
  const purgeAfter = new Date(now.getTime() + PURGE_DELAY_HOURS * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: now, purgeAfter },
  })

  return { deletedAt: now, purgeAfter }
}

/** Đổi ý trong thời gian chờ 48 giờ. */
export async function cancelAccountDeletion(userId: string) {
  await prisma.user.updateMany({
    where: { id: userId, deletedAt: { not: null } },
    data: { deletedAt: null, purgeAfter: null },
  })
}

/**
 * Xoá cứng những tài khoản đã quá hạn 48 giờ.
 * Gọi từ cron. Trả về danh sách id đã xoá để kiểm chứng.
 */
export async function purgeExpiredAccounts(now = new Date()): Promise<string[]> {
  const due = await prisma.user.findMany({
    where: { deletedAt: { not: null }, purgeAfter: { lte: now } },
    select: { id: true, email: true },
  })
  if (due.length === 0) return []

  const ids = due.map((u) => u.id)

  // Attempt.userId là SetNull nên bài làm sẽ mất liên kết chứ không tự xoá.
  // Phải xoá tường minh — dữ liệu bài làm gắn với cá nhân cũng là dữ liệu cá nhân.
  await prisma.$transaction([
    prisma.annotation.deleteMany({ where: { attempt: { userId: { in: ids } } } }),
    prisma.attemptAnswer.deleteMany({ where: { attempt: { userId: { in: ids } } } }),
    prisma.attempt.deleteMany({ where: { userId: { in: ids } } }),
    prisma.guardianConsentToken.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }), // cascade: consents, accounts, sessions, studyPlans, calendarConn
  ])

  return ids
}
