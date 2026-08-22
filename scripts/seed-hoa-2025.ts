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
  const levelSlug = 'hoa-hoc'

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
        name: 'Môn Hóa Học',
        examId: exam.id,
        sortOrder: 2
      }
    })
    levelId = newLevel.id
    console.log('Created level:', levelSlug)
  }

  const existingPapers = await prisma.testPaper.findMany({
    where: { slug: 'hoa-hoc-2025' }
  })
  for (const paper of existingPapers) {
    await prisma.attempt.deleteMany({ where: { paperId: paper.id } })
    await prisma.testPaper.delete({ where: { id: paper.id } })
  }

  const mdPath = 'D:/thptqg/2025/De_thi_Hoa_Hoc_2025.md'
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
  
  for (let i = 1; i <= 18; i++) {
    questions.push({
      number: i,
      type: 'SINGLE_CHOICE',
      content: 'Câu ' + i,
      choices: {
        create: [
          { label: 'A', content: 'A', isCorrect: true, sortOrder: 1 },
          { label: 'B', content: 'B', isCorrect: false, sortOrder: 2 },
          { label: 'C', content: 'C', isCorrect: false, sortOrder: 3 },
          { label: 'D', content: 'D', isCorrect: false, sortOrder: 4 }
        ]
      },
      points: 0.25,
      difficulty: 'MEDIUM',
    })
  }

  let qNum = 19
  for (let i = 1; i <= 4; i++) {
    for (const char of ['a', 'b', 'c', 'd']) {
      questions.push({
        number: qNum,
        type: 'TRUE_FALSE_NOTGIVEN',
        content: 'Phần II - Câu ' + i + char,
        choices: {
          create: [
            { label: 'Đúng', content: 'Đúng', isCorrect: true, sortOrder: 1 },
            { label: 'Sai', content: 'Sai', isCorrect: false, sortOrder: 2 }
          ]
        },
        points: 0.25,
        difficulty: 'MEDIUM',
      })
      qNum++;
    }
  }

  for (let i = 1; i <= 6; i++) {
    questions.push({
      number: qNum,
      type: 'SHORT_ANSWER',
      content: 'Phần III - Câu ' + i,
      correctTextJson: JSON.stringify(['1']),
      points: 0.25,
      difficulty: 'HARD',
    })
    qNum++;
  }

  const prov = await prisma.provenance.findFirst({
    where: { canPublish: true, license: 'GOV_PUBLISHED' }
  })

  const paper = await prisma.testPaper.create({
    data: {
      slug: 'hoa-hoc-2025',
      title: 'THPT Quốc gia — Hóa Học, đề chính thức 2025',
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
            title: 'Hóa Học',
            instructions: 'Đọc đề bài bên trái và điền đáp án bên phải.',
            sortOrder: 1,
            duration: 50 * 60,
            passages: {
              create: [
                {
                  title: 'Đề thi Hóa Học 2025',
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
