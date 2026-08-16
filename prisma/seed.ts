import path from 'node:path'
import process from 'node:process'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
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

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
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
  'restricted-internal': {
    license: 'RESTRICTED',
    sourceName: 'Tài liệu nội bộ',
    sourceUrl: null,
    attribution: null,
    canPublish: false, // <- chốt chặn được kiểm chứng trong luồng public
    notes: 'CHỈ tham khảo nội bộ. Không có quyền phân phối. Dùng để test content filter.',
  },
} as const

async function reset() {
  // Xoá theo thứ tự phụ thuộc (SQLite không cascade qua deleteMany song song)
  await prisma.annotation.deleteMany()
  await prisma.attemptAnswer.deleteMany()
  await prisma.attempt.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.studyPlan.deleteMany()
  await prisma.calendarConnection.deleteMany()
  await prisma.consent.deleteMany()
  await prisma.user.deleteMany()
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

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Quản trị viên',
      role: 'ADMIN',
      passwordHash: devPassword,
      birthDate: new Date('1990-05-20'),
      consents: {
        create: [
          { purpose: 'SERVICE_ESSENTIAL', granted: true },
          { purpose: 'ANALYTICS', granted: true },
        ],
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'linh@example.com',
      name: 'Nguyễn Thuỳ Linh',
      role: 'USER',
      passwordHash: devPassword,
      birthDate: new Date('2001-03-14'),
      consents: {
        create: [
          { purpose: 'SERVICE_ESSENTIAL', granted: true },
          { purpose: 'LEADERBOARD_PUBLIC', granted: true },
          { purpose: 'MARKETING_EMAIL', granted: false },
        ],
      },
    },
  })

  // User < 16 tuổi, CHƯA có guardian consent
  // -> không được lên bảng xếp hạng công khai, không nhận email marketing (SPEC F6)
  const minorBirth = new Date()
  minorBirth.setFullYear(minorBirth.getFullYear() - 14)
  await prisma.user.create({
    data: {
      email: 'minh.teen@example.com',
      name: 'Trần Quang Minh',
      role: 'USER',
      passwordHash: devPassword,
      birthDate: minorBirth,
      isMinor: true,
      guardianConsent: false,
      guardianEmail: 'phuhuynh@example.com',
      consents: { create: [{ purpose: 'SERVICE_ESSENTIAL', granted: true }] },
    },
  })

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
