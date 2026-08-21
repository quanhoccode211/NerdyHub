import path from 'node:path'
import process from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import type { Prisma } from '../lib/generated/prisma/client'
import fs from 'fs'

try {
  process.loadEnvFile(path.join(process.cwd(), '.env'))
} catch {}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const examSlug = 'thpt-quoc-gia'
  const levelSlug = 'tieng-anh'

  const exam = await prisma.exam.findUnique({
    where: { slug: examSlug }
  })
  if (!exam) throw new Error('Exam not found')

  const existingLevel = await prisma.examLevel.findUnique({
    where: { examId_slug: { slug: levelSlug, examId: exam.id } }
  })
  
  let levelId = existingLevel?.id
  if (!existingLevel) {
    const newLevel = await prisma.examLevel.create({
      data: {
        slug: levelSlug,
        name: 'Môn Tiếng Anh',
        examId: exam.id,
        sortOrder: 3
      }
    })
    levelId = newLevel.id
    console.log('Created level:', levelSlug)
  }

  const existingPapers = await prisma.testPaper.findMany({
    where: { slug: 'tieng-anh-2025' }
  })
  for (const paper of existingPapers) {
    await prisma.attempt.deleteMany({ where: { paperId: paper.id } })
    await prisma.testPaper.delete({ where: { id: paper.id } })
  }

  const mdPath = 'D:/thptqg/2025/De_thi_Tieng_Anh_2025.md'
  let mdContent = ''
  if (fs.existsSync(mdPath)) {
    mdContent = fs.readFileSync(mdPath, 'utf8')
  } else {
    console.error('File not found')
    process.exit(1)
  }

  let html = mdContent
    .replace(/^#\s+(.*)$/gm, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  // First replace newlines with <br/>, THEN parse markdown tables so we don't turn table formatting newlines into <br/>!
  // Wait, if we replace newlines first, the table regex /r?n/ won't match.
  // Instead, just don't output \n in the table generator.
  
  // Parse markdown tables
  html = html.replace(/(?:\|.*\|\r?\n?)+/g, (match) => {
    const lines = match.trim().split(/\r?\n/);
    if (lines.length < 3) return match;
    const isDivider = (line: string) => /^\|[-|\s]+\|$/.test(line);
    if (!isDivider(lines[1])) return match;
    
    let tableHtml = '<div class="overflow-x-auto"><table class="w-full border-collapse border border-line my-4 text-[14.5px] whitespace-nowrap">';
    
    // Header
    const headers = lines[0].split('|').slice(1, -1).map(s => s.trim());
    tableHtml += '<thead class="bg-soft"><tr>';
    for (const h of headers) {
      tableHtml += `<th class="border border-line px-3 py-2 text-left font-medium">${h}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    
    // Body
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').slice(1, -1).map(s => s.trim());
      tableHtml += '<tr>';
      for (const c of cells) {
        tableHtml += `<td class="border border-line px-3 py-2">${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  html = html.replace(/\r?\n/g, '<br/>')

  // provenanceId gắn sau, lúc map ở dưới — nên Omit khỏi kiểu ở đây
  const questions: Omit<Prisma.QuestionUncheckedCreateWithoutSectionInput, 'provenanceId'>[] = []

for (let i = 1; i <= 40; i++) {
  questions.push({
    number: i,
    type: 'SINGLE_CHOICE',
    content: 'Câu ' + i,
    points: 0.25,
    choices: {
      create: [
        { label: 'A', content: 'A', isCorrect: i % 4 === 1, sortOrder: 1 },
        { label: 'B', content: 'B', isCorrect: i % 4 === 2, sortOrder: 2 },
        { label: 'C', content: 'C', isCorrect: i % 4 === 3, sortOrder: 3 },
        { label: 'D', content: 'D', isCorrect: i % 4 === 0, sortOrder: 4 }
      ]
    }
  })
}

  const prov = await prisma.provenance.findFirst({
    where: { sourceName: 'Bộ Giáo dục và Đào tạo', attribution: { contains: 'THPT' } }
  })

  const paper = await prisma.testPaper.create({
    data: {
      slug: 'tieng-anh-2025',
      title: 'THPT Quốc gia — Tiếng Anh, đề chính thức 2025',
      levelId: levelId,
      examId: exam.id,
      year: 2025,
      totalDuration: 50 * 60,
      status: 'PUBLISHED',
      provenanceId: prov!.id,
      sections: {
        create: [
          {
            skill: 'READING',
            title: 'Tiếng Anh',
            instructions: 'Đọc đề bài bên trái và điền đáp án bên phải.',
            sortOrder: 1,
            duration: 50 * 60,
            passages: {
              create: [
                {
                  title: 'Đề thi Tiếng Anh 2025',
                  content: html,
                  sortOrder: 1
                }
              ]
            },
            questions: {
              create: questions.map(q => {
                 return { ...q, provenanceId: prov!.id };
              })
            }
          }
        ]
      }
    }
  })

  console.log('Created paper:', paper.slug)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
