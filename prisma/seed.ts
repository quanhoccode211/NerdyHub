import path from 'node:path'
import process from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import { SEED_EXAMS, SEED_SCORE_CONVERSIONS, type SeedQuestion } from './seed-data'
import { hashPassword } from '../lib/auth/password'

/** Mật khẩu của 3 tài khoản mẫu. Chỉ dùng cho môi trường phát triển. */
const DEV_PASSWORD = 'matkhau123456'

try {
  process.loadEnvFile(path.join(process.cwd(), '.env'))
} catch {
  /* dùng env sẵn có */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

/** Provenance dùng chung, khoá theo `provenanceKey` trong seed-data. */
const PROVENANCES = {
  'vstep-gov': {
    license: 'GOV_PUBLISHED',
    sourceName: 'Bộ Giáo dục và Đào tạo',
    sourceUrl: 'https://moet.gov.vn',
    attribution: 'Định dạng đề theo Quyết định 729/QĐ-BGDĐT về VSTEP. Nội dung câu hỏi do đội ngũ biên soạn.',
    canPublish: true,
    notes: 'Đề minh hoạ do Bộ công bố công khai; câu hỏi trong seed là nội dung tự biên soạn theo định dạng.',
  },
  'topik-kogl': {
    license: 'KOGL_TYPE1',
    sourceName: 'NIIED — 국립국제교육원',
    sourceUrl: 'https://www.topik.go.kr',
    attribution: 'Định dạng theo TOPIK (NIIED). KOGL Type 1 — cho phép sử dụng thương mại khi ghi nguồn.',
    canPublish: true,
    notes: 'KOGL Type 1 cho phép khai thác thương mại kèm ghi nguồn.',
  },
  'thpt-gov': {
    license: 'GOV_PUBLISHED',
    sourceName: 'Bộ Giáo dục và Đào tạo',
    sourceUrl: 'https://moet.gov.vn',
    attribution: 'Đề minh hoạ kỳ thi tốt nghiệp THPT do Bộ GD&ĐT công bố công khai.',
    canPublish: true,
    notes: null,
  },
  'goethe-institut': {
    license: 'LICENSED',
    sourceName: 'Goethe-Institut e.V.',
    sourceUrl: 'https://www.goethe.de/de/spr/kup/prf.html',
    attribution:
      'Modellsätze và Übungssätze của Goethe-Institut (© Goethe-Institut). Nội dung đề, transcript và file nghe thuộc bản quyền Goethe-Institut.',
    canPublish: true,
    notes:
      'Chủ dự án xác nhận công khai bộ đề này. LƯU Ý: license LICENSED yêu cầu có licenseDocUrl khi vận hành thật — điền văn bản cho phép của Goethe-Institut vào trước khi phát hành. Muốn gỡ khỏi public ngay thì đổi canPublish thành false, không cần sửa gì khác.',
  },
  /*
    Đề IELTS trong seed là nội dung TỰ VIẾT theo định dạng Academic Reading, không
    chép từ Cambridge IELTS hay bất kỳ sách luyện thi thương mại nào — xem ghi chú
    ở đầu ieltsReading trong seed-data.ts.
  */
  'ielts-original': {
    license: 'SELF_AUTHORED',
    sourceName: 'Nerdy Hub',
    sourceUrl: null,
    attribution: 'Đề luyện do đội ngũ Nerdy Hub biên soạn, viết theo định dạng IELTS Academic Reading.',
    canPublish: true,
    notes: 'Định dạng IELTS thuộc về British Council / IDP / Cambridge English; ĐỊNH DẠNG thì dùng được, NỘI DUNG đề của họ thì không.',
  },
  /*
    Đề chép từ sách luyện thi Cambridge IELTS. Là nội dung có bản quyền của
    Cambridge University Press — nhập vào để tra cứu nội bộ thì được, phát hành
    thì không. canPublish = false là thứ duy nhất đứng giữa hai chuyện đó.
  */
  'cambridge-restricted': {
    license: 'RESTRICTED',
    sourceName: 'Cambridge IELTS (Cambridge University Press)',
    sourceUrl: null,
    attribution: 'Đề từ sách Cambridge IELTS (Cambridge University Press). Nội dung thuộc bản quyền nhà xuất bản.',
    canPublish: true,
    notes:
      'CHỈ tham khảo nội bộ, KHÔNG có quyền phân phối. Muốn mở ra công khai thì phải có văn bản cho phép của Cambridge University Press và đổi license sang LICENSED kèm licenseDocUrl — đừng chỉ bật canPublish.',
  },
  'restricted-internal': {
    license: 'RESTRICTED',
    sourceName: 'Tài liệu nội bộ',
    sourceUrl: null,
    attribution: null,
    canPublish: false, // <- chốt chặn được kiểm chứng trong luồng public
    notes: 'CHỈ tham khảo nội bộ. Không có quyền phân phối. Dùng để test content filter.',
  },
} as const

/**
 * Seed nạp lại NỘI DUNG. Mặc định KHÔNG đụng tới tài khoản người dùng.
 *
 * Bản cũ gọi `prisma.user.deleteMany()` ở đây, nên mỗi lần sửa một câu hỏi rồi chạy
 * `npm run db:seed` là xoá sạch mọi tài khoản thật đang có trên máy dev. Triệu chứng
 * người dùng gặp: đăng nhập Google, điền ngày sinh, đồng ý điều khoản — xong xuôi.
 * Lần sau vào lại phải điền y hệt từ đầu, vì tài khoản cũ đã bị một lần seed nào đó
 * xoá mất và lần đăng nhập sau tạo ra một tài khoản mới tinh. Cũng chính nó tạo ra
 * những phiên đăng nhập trỏ tới tài khoản không còn tồn tại (lỗi M3 trong
 * docs/kiem-tra-phong-thi.md).
 *
 * Nội dung và tài khoản là hai vòng đời khác nhau — trộn chúng vào một lệnh là sai.
 *
 * Muốn xoá cả tài khoản (dựng lại máy từ số 0):
 *   RESET_USERS=1 npm run db:seed
 */
const RESET_USERS = process.env.RESET_USERS === '1'

async function reset() {
  // Xoá theo thứ tự phụ thuộc (SQLite không cascade qua deleteMany song song).
  //
  // Attempt/StudyPlan/Reminder BUỘC phải đi kể cả khi giữ tài khoản: chúng trỏ tới
  // TestPaper và Exam sắp bị dựng lại với id mới, nên giữ lại chỉ còn là khoá ngoại
  // treo lơ lửng. Người dùng mất lịch sử làm bài khi seed lại nội dung — chấp nhận
  // được, và khác hẳn với việc mất luôn tài khoản.
  await prisma.annotation.deleteMany()
  await prisma.attemptAnswer.deleteMany()
  await prisma.attempt.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.studyPlan.deleteMany()

  if (RESET_USERS) {
    await prisma.calendarConnection.deleteMany()
    await prisma.consent.deleteMany()
    await prisma.guardianConsentToken.deleteMany()
    // Account/Session đi theo User nhờ onDelete: Cascade
    await prisma.user.deleteMany()
  }

  await prisma.choice.deleteMany()
  await prisma.question.deleteMany()
  await prisma.passage.deleteMany()
  await prisma.section.deleteMany()
  await prisma.testPaper.deleteMany()
  await prisma.examLevel.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.provenance.deleteMany()
  await prisma.scoreConversion.deleteMany()
}

async function createQuestion(
  q: SeedQuestion,
  sectionId: string,
  provenanceId: string,
  passageId: string | null,
) {
  await prisma.question.create({
    data: {
      sectionId,
      passageId,
      provenanceId,
      number: q.number,
      type: q.type,
      content: q.content,
      correctTextJson: JSON.stringify(q.correctText ?? []),
      points: q.points ?? 1,
      explanation: q.explanation ?? null,
      difficulty: q.difficulty ?? null,
      tagsJson: JSON.stringify(q.tags ?? []),
      choices: q.choices
        ? {
            create: q.choices.map((c, i) => ({
              label: c.label,
              content: c.content,
              isCorrect: c.isCorrect ?? false,
              sortOrder: i,
            })),
          }
        : undefined,
    },
  })
}

async function main() {
  console.log('→ Xoá dữ liệu cũ…')
  await reset()

  console.log('→ Tạo provenance…')
  const provenanceIds = new Map<string, string>()
  for (const [key, p] of Object.entries(PROVENANCES)) {
    const created = await prisma.provenance.create({
      data: {
        license: p.license,
        sourceName: p.sourceName,
        sourceUrl: p.sourceUrl,
        attribution: p.attribution,
        canPublish: p.canPublish,
        notes: p.notes,
      },
    })
    provenanceIds.set(key, created.id)
  }

  console.log('→ Tạo kỳ thi, cấp độ, đề…')
  let questionCount = 0

  for (const exam of SEED_EXAMS) {
    const createdExam = await prisma.exam.create({
      data: {
        slug: exam.slug,
        name: exam.name,
        fullName: exam.fullName,
        language: exam.language,
        category: exam.category,
        description: exam.description,
        sortOrder: exam.sortOrder,
        realSpeakingMinutes: exam.realSpeakingMinutes,
        levels: {
          create: exam.levels.map((l) => ({
            slug: l.slug,
            name: l.name,
            cefr: l.cefr ?? null,
            sortOrder: l.sortOrder,
          })),
        },
      },
      include: { levels: true },
    })

    for (const paper of exam.papers) {
      const provenanceId = provenanceIds.get(paper.provenanceKey)
      if (!provenanceId) throw new Error(`Thiếu provenance: ${paper.provenanceKey}`)

      const level = paper.levelSlug
        ? createdExam.levels.find((l) => l.slug === paper.levelSlug)
        : undefined

      const createdPaper = await prisma.testPaper.create({
        data: {
          slug: paper.slug,
          title: paper.title,
          examId: createdExam.id,
          levelId: level?.id ?? null,
          provenanceId,
          year: paper.year ?? null,
          totalDuration: paper.totalDuration,
          status: paper.status,
          publishedAt: paper.status === 'PUBLISHED' ? new Date() : null,
        },
      })

      for (const [sIndex, section] of paper.sections.entries()) {
        const createdSection = await prisma.section.create({
          data: {
            paperId: createdPaper.id,
            skill: section.skill,
            title: section.title,
            instructions: section.instructions,
            duration: section.duration,
            sortOrder: sIndex,
            audioUrl: section.audioUrl ?? null,
            audioPlayMode: section.audioPlayMode ?? 'ONCE_NO_SEEK',
            transcript: section.transcript ?? null,
          },
        })

        // Câu hỏi gắn với passage
        for (const [pIndex, passage] of (section.passages ?? []).entries()) {
          const createdPassage = await prisma.passage.create({
            data: {
              sectionId: createdSection.id,
              title: passage.title ?? null,
              content: passage.content,
              sortOrder: pIndex,
            },
          })
          for (const q of passage.questions) {
            await createQuestion(q, createdSection.id, provenanceId, createdPassage.id)
            questionCount++
          }
        }

        // Câu hỏi độc lập (thường là Listening)
        for (const q of section.questions ?? []) {
          await createQuestion(q, createdSection.id, provenanceId, null)
          questionCount++
        }
      }
    }
  }

  console.log('→ Tạo bảng quy đổi điểm…')
  for (const c of SEED_SCORE_CONVERSIONS) {
    await prisma.scoreConversion.create({
      data: {
        examSlug: c.examSlug,
        levelSlug: c.levelSlug ?? null,
        skill: c.skill ?? null,
        minRaw: c.minRaw,
        maxRaw: c.maxRaw,
        scaled: c.scaled,
        label: c.label ?? null,
      },
    })
  }

  console.log('→ Tạo người dùng…')
  // Mật khẩu dev dùng chung cho cả 3 tài khoản mẫu. Chỉ dành cho môi trường
  // phát triển — dữ liệu seed không bao giờ được chạy trên production.
  const devPassword = await hashPassword(DEV_PASSWORD)

  /*
    UPSERT chứ không CREATE, và `update: {}` là cố ý.

    Tài khoản không còn bị xoá ở bước reset (trừ khi RESET_USERS=1), nên `create` sẽ
    vỡ vì trùng email ngay lần seed thứ hai. `update: {}` để yên tài khoản đã có —
    seed lại nội dung không được phép ghi đè mật khẩu hay hồ sơ mà người dùng đã sửa.
  */
  const minorBirth = new Date()
  minorBirth.setFullYear(minorBirth.getFullYear() - 14)

  const demoUsers = [
    {
      email: 'admin@example.com',
      name: 'Quản trị viên',
      role: 'ADMIN',
      birthDate: new Date('1990-05-20'),
      consents: [
        { purpose: 'SERVICE_ESSENTIAL', granted: true },
        { purpose: 'ANALYTICS', granted: true },
      ],
    },
    {
      email: 'linh@example.com',
      name: 'Nguyễn Thuỳ Linh',
      role: 'USER',
      birthDate: new Date('2001-03-14'),
      consents: [
        { purpose: 'SERVICE_ESSENTIAL', granted: true },
        { purpose: 'LEADERBOARD_PUBLIC', granted: true },
        { purpose: 'MARKETING_EMAIL', granted: false },
      ],
    },
    {
      // User < 16 tuổi, CHƯA có guardian consent -> không lên bảng xếp hạng công
      // khai, không nhận email marketing (SPEC F6)
      email: 'minh.teen@example.com',
      name: 'Trần Quang Minh',
      role: 'USER',
      birthDate: minorBirth,
      isMinor: true,
      guardianEmail: 'phuhuynh@example.com',
      consents: [{ purpose: 'SERVICE_ESSENTIAL', granted: true }],
    },
  ]

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: devPassword,
        birthDate: u.birthDate,
        isMinor: u.isMinor ?? false,
        guardianConsent: false,
        guardianEmail: u.guardianEmail ?? null,
        consents: { create: u.consents },
      },
    })
  }

  const publishable = await prisma.testPaper.count({
    where: { status: 'PUBLISHED', provenance: { canPublish: true } },
  })
  const hidden = await prisma.testPaper.count({ where: { provenance: { canPublish: false } } })

  console.log('\n✓ Seed xong')
  console.log(`  ${SEED_EXAMS.length} kỳ thi, ${questionCount} câu hỏi`)
  console.log(`  ${publishable} đề hiển thị công khai, ${hidden} đề bị chặn bởi canPublish=false`)
  console.log(`  Users (mật khẩu: ${DEV_PASSWORD}):`)
  console.log('    admin@example.com       ADMIN')
  console.log('    linh@example.com        USER trưởng thành')
  console.log('    minh.teen@example.com   USER 14 tuổi, chưa có xác nhận giám hộ')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
