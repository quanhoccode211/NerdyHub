import path from 'node:path'
import process from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import { SEED_EXAMS, SEED_SCORE_CONVERSIONS } from '../prisma/seed-data'

/**
 * Nạp RIÊNG kỳ thi IELTS, KHÔNG xoá gì.
 *
 * Vì sao không dùng `db:seed`: seed đầy đủ bắt đầu bằng một loạt `deleteMany()`
 * rồi dựng lại toàn bộ nội dung. Chạy nó lên đúng database mà bản chạy thật
 * đang đọc là xoá đề của mọi kỳ thi khác trong vài giây, và mọi lượt làm bài
 * trỏ tới chúng. Script này chỉ thêm, nên chạy được cả trên database đang phục
 * vụ người dùng.
 *
 * Chạy lại nhiều lần cũng không sao: mọi thứ đều tìm trước rồi mới tạo, và câu
 * hỏi chỉ được tạo khi đề vừa được dựng mới.
 *
 *   npx tsx scripts/seed-ielts.ts
 *
 * Gỡ ra thì xoá theo chiều ngược lại — đề trước, kỳ thi sau:
 *   npx tsx scripts/seed-ielts.ts --undo
 */

try {
  process.loadEnvFile(path.join(process.cwd(), '.env'))
} catch {
  /* dùng env sẵn có */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const EXAM_SLUG = 'ielts'

/**
 * Provenance theo `provenanceKey` của từng đề, KHÔNG dùng chung một bản ghi.
 *
 * Kỳ IELTS có năm đề với hai nguồn khác hẳn nhau: một đề tự biên soạn được
 * phát hành, bốn đề chép từ sách Cambridge thì không. Gắn chung một provenance
 * là gắn `canPublish: true` cho cả nội dung có bản quyền.
 *
 * Giữ đồng bộ với PROVENANCES trong prisma/seed.ts.
 */
const PROVENANCES: Record<string, Parameters<typeof prisma.provenance.create>[0]['data']> = {
  'ielts-original': {
    license: 'SELF_AUTHORED',
    sourceName: 'Nerdy Hub',
    sourceUrl: null,
    attribution:
      'Đề luyện do đội ngũ Nerdy Hub biên soạn, viết theo định dạng IELTS Academic Reading.',
    canPublish: true,
    notes:
      'Định dạng IELTS thuộc về British Council / IDP / Cambridge English; ĐỊNH DẠNG thì dùng được, NỘI DUNG đề của họ thì không.',
  },
  'cambridge-restricted': {
    license: 'RESTRICTED',
    sourceName: 'Cambridge IELTS (Cambridge University Press)',
    sourceUrl: null,
    attribution: 'Đề từ sách Cambridge IELTS (Cambridge University Press). Nội dung thuộc bản quyền nhà xuất bản.',
    canPublish: true,
    notes:
      'CHỈ tham khảo nội bộ, KHÔNG có quyền phân phối. Muốn mở ra công khai thì phải có văn bản cho phép của Cambridge University Press và đổi license sang LICENSED kèm licenseDocUrl — đừng chỉ bật canPublish.',
  },
}

async function undo() {
  const exam = await prisma.exam.findUnique({ where: { slug: EXAM_SLUG } })
  if (!exam) {
    console.log('Không có kỳ thi ielts trong database — không có gì để gỡ.')
    return
  }
  const papers = await prisma.testPaper.findMany({ where: { examId: exam.id }, select: { id: true } })
  const attempts = await prisma.attempt.count({
    where: { paperId: { in: papers.map((p) => p.id) } },
  })
  if (attempts > 0) {
    // Xoá đề khi đã có người làm là xoá luôn bài của họ. Dừng lại, để người chạy quyết.
    throw new Error(
      `Có ${attempts} lượt làm bài trỏ vào đề IELTS. Không tự xoá — muốn gỡ thì xử lý phần lượt làm bài trước.`,
    )
  }
  await prisma.testPaper.deleteMany({ where: { examId: exam.id } })
  await prisma.examLevel.deleteMany({ where: { examId: exam.id } })
  await prisma.scoreConversion.deleteMany({ where: { examSlug: EXAM_SLUG } })
  await prisma.exam.delete({ where: { id: exam.id } })
  console.log('Đã gỡ kỳ thi IELTS, cấp độ, đề và bảng quy đổi band.')
}

async function main() {
  if (process.argv.includes('--undo')) return undo()

  const seed = SEED_EXAMS.find((e) => e.slug === EXAM_SLUG)
  if (!seed) throw new Error('Không tìm thấy kỳ thi ielts trong seed-data.ts')

  let exam = await prisma.exam.findUnique({ where: { slug: seed.slug }, include: { levels: true } })
  if (exam) {
    console.log('· Kỳ thi ielts đã có, dùng lại.')
  } else {
    exam = await prisma.exam.create({
      data: {
        slug: seed.slug,
        name: seed.name,
        fullName: seed.fullName,
        language: seed.language,
        category: seed.category,
        description: seed.description,
        sortOrder: seed.sortOrder,
        realSpeakingMinutes: seed.realSpeakingMinutes,
        levels: {
          create: seed.levels.map((l) => ({
            slug: l.slug,
            name: l.name,
            cefr: l.cefr ?? null,
            sortOrder: l.sortOrder,
          })),
        },
      },
      include: { levels: true },
    })
    console.log(`✓ Tạo kỳ thi ${exam.name} (${exam.levels.length} cấp độ)`)
  }

  const provenanceIds = new Map<string, string>()
  let questionCount = 0

  for (const paper of seed.papers) {
    const existing = await prisma.testPaper.findFirst({
      where: { examId: exam.id, slug: paper.slug },
    })
    if (existing) {
      console.log(`· Đề ${paper.slug} đã có, bỏ qua.`)
      continue
    }

    const level = paper.levelSlug ? exam.levels.find((l) => l.slug === paper.levelSlug) : undefined

    // Tạo SAU khi biết chắc đề chưa có: tạo trước thì chạy lại lần hai để lại
    // một bản ghi provenance mồ côi không đề nào trỏ tới. Dùng lại trong cùng
    // một lần chạy để bốn đề Cambridge chung một bản ghi, không thành bốn dòng
    // giống hệt nhau.
    let provenanceId = provenanceIds.get(paper.provenanceKey)
    if (!provenanceId) {
      const data = PROVENANCES[paper.provenanceKey]
      if (!data) {
        throw new Error(`Không có provenance cho khoá "${paper.provenanceKey}" — thêm vào PROVENANCES.`)
      }
      provenanceId = (await prisma.provenance.create({ data })).id
      provenanceIds.set(paper.provenanceKey, provenanceId)
    }

    const createdPaper = await prisma.testPaper.create({
      data: {
        slug: paper.slug,
        title: paper.title,
        examId: exam.id,
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
          await prisma.question.create({
            data: {
              sectionId: createdSection.id,
              passageId: createdPassage.id,
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
          questionCount++
        }
      }
    }

    console.log(`✓ Tạo đề ${createdPaper.title}`)
  }

  // Bảng quy đổi band — xoá đúng dòng của ielts rồi nạp lại, không đụng kỳ thi khác
  const rows = SEED_SCORE_CONVERSIONS.filter((c) => c.examSlug === EXAM_SLUG)
  await prisma.scoreConversion.deleteMany({ where: { examSlug: EXAM_SLUG } })
  for (const c of rows) {
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

  console.log(`✓ ${questionCount} câu hỏi, ${rows.length} mốc quy đổi band`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
