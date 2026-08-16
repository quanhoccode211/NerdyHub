import type { AudioPlayMode, Difficulty, QuestionType, Skill } from '../lib/enums'

/**
 * Dữ liệu seed khai báo — SPEC mục 7.
 *
 * LƯU Ý VỀ NỘI DUNG: toàn bộ câu hỏi dưới đây là nội dung TỰ BIÊN SOẠN cho môi
 * trường dev, viết theo *định dạng* của từng kỳ thi. Không sao chép đề thi thật.
 * Trường provenance mô tả nguồn mà dữ liệu thật sẽ mang khi vận hành.
 */

export type SeedQuestion = {
  number: number
  type: QuestionType
  content: string
  choices?: { label: string; content: string; isCorrect?: boolean }[]
  correctText?: string[]
  points?: number
  explanation?: string
  difficulty?: Difficulty
  tags?: string[]
}

export type SeedPassage = {
  title?: string
  content: string
  questions: SeedQuestion[]
}

export type SeedSection = {
  skill: Skill
  title: string
  instructions: string
  duration: number
  audioUrl?: string
  audioPlayMode?: AudioPlayMode
  transcript?: string
  passages?: SeedPassage[]
  questions?: SeedQuestion[]
}

export type SeedPaper = {
  slug: string
  title: string
  levelSlug?: string
  year?: number
  totalDuration: number
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  provenanceKey: string
  sections: SeedSection[]
}

export type SeedExam = {
  slug: string
  name: string
  fullName: string
  language: 'EN' | 'KO' | 'JA' | 'ZH' | 'DE' | 'VI'
  category: 'LANGUAGE_CERT' | 'NATIONAL_EXAM' | 'APTITUDE'
  description: string
  sortOrder: number
  levels: { slug: string; name: string; cefr?: string; sortOrder: number }[]
  papers: SeedPaper[]
}

// helper: tạo nhanh 4 lựa chọn A-D với chỉ số đáp án đúng
function mc(a: string, b: string, c: string, d: string, correctIndex: number) {
  return ['A', 'B', 'C', 'D'].map((label, i) => ({
    label,
    content: [a, b, c, d][i],
    isCorrect: i === correctIndex,
  }))
}

// ============================================================================
// VSTEP
// ============================================================================

const vstepListening: SeedSection = {
  skill: 'LISTENING',
  title: 'Part 1 — Short conversations',
  instructions:
    'Bạn sẽ nghe 10 đoạn hội thoại ngắn. Mỗi đoạn chỉ phát MỘT LẦN. Chọn phương án đúng nhất (A, B, C hoặc D) cho mỗi câu.',
  duration: 15 * 60,
  audioUrl: '/audio/vstep-listening-part1.wav',
  audioPlayMode: 'ONCE_NO_SEEK',
  transcript:
    'Đây là bản ghi lời thoại mẫu dùng cho môi trường phát triển. Trong hệ thống thật, transcript đầy đủ của đoạn ghi âm sẽ hiển thị tại đây sau khi thí sinh nộp bài.',
  questions: [
    {
      number: 1,
      type: 'SINGLE_CHOICE',
      content: 'What is the main reason the woman missed the meeting?',
      choices: mc('Her train was delayed.', 'She forgot the date.', 'She was ill.', 'She was on holiday.', 0),
      difficulty: 'EASY',
      tags: ['detail', 'daily-life'],
      explanation: 'Người nói nhắc tới "the 8:15 was held up for almost an hour" — tàu bị hoãn.',
    },
    {
      number: 2,
      type: 'SINGLE_CHOICE',
      content: 'Where does this conversation most likely take place?',
      choices: mc('At a bank', 'At a post office', 'At a library', 'At a pharmacy', 2),
      difficulty: 'EASY',
      tags: ['inference', 'context'],
    },
    {
      number: 3,
      type: 'SINGLE_CHOICE',
      content: 'What does the man suggest the woman do?',
      choices: mc('Apply online', 'Come back tomorrow', 'Call the manager', 'Fill in a paper form', 0),
      difficulty: 'MEDIUM',
      tags: ['detail'],
    },
    {
      number: 4,
      type: 'SINGLE_CHOICE',
      content: "What is the speaker's attitude towards the new policy?",
      choices: mc('Enthusiastic', 'Sceptical', 'Indifferent', 'Confused', 1),
      difficulty: 'HARD',
      tags: ['attitude', 'inference'],
    },
    {
      number: 5,
      type: 'SINGLE_CHOICE',
      content: 'How much will the woman pay in total?',
      choices: mc('£12', '£20', '£24', '£32', 2),
      difficulty: 'MEDIUM',
      tags: ['numbers', 'detail'],
    },
    {
      number: 6,
      type: 'SINGLE_CHOICE',
      content: 'What time does the next bus leave?',
      choices: mc('9:15', '9:30', '9:45', '10:00', 1),
      difficulty: 'EASY',
      tags: ['numbers', 'detail'],
    },
    {
      number: 7,
      type: 'SINGLE_CHOICE',
      content: 'Why is the man calling?',
      choices: mc(
        'To cancel an appointment',
        'To reschedule an appointment',
        'To complain about a service',
        'To ask for directions',
        1,
      ),
      difficulty: 'MEDIUM',
      tags: ['purpose'],
    },
    {
      number: 8,
      type: 'SINGLE_CHOICE',
      content: 'What problem does the woman mention?',
      choices: mc(
        'The room is too small.',
        'The equipment is broken.',
        'The price is too high.',
        'The location is inconvenient.',
        1,
      ),
      difficulty: 'MEDIUM',
      tags: ['detail', 'problem'],
    },
    {
      number: 9,
      type: 'SINGLE_CHOICE',
      content: 'What will the speakers probably do next?',
      choices: mc('Have lunch', 'Return to the office', 'Visit a client', 'Take a taxi', 3),
      difficulty: 'HARD',
      tags: ['inference', 'prediction'],
    },
    {
      number: 10,
      type: 'SINGLE_CHOICE',
      content: 'According to the announcement, which service is temporarily unavailable?',
      choices: mc('Online banking', 'ATM withdrawals', 'Currency exchange', 'Loan applications', 0),
      difficulty: 'MEDIUM',
      tags: ['detail', 'announcement'],
    },
  ],
}

const vstepReading: SeedSection = {
  skill: 'READING',
  title: 'Part 1 — Reading comprehension',
  instructions:
    'Đọc đoạn văn và trả lời các câu hỏi bên dưới. Bạn có thể bôi đen để tô sáng hoặc ghi chú trực tiếp trên đề.',
  duration: 20 * 60,
  passages: [
    {
      title: 'The quiet return of the night train',
      content: `<p>For decades the sleeper train looked like a relic. Budget airlines undercut it on price, high-speed rail beat it on daytime speed, and operators across Europe quietly retired their carriages. By 2015 many routes that had run since the 1950s existed only in timetables that nobody printed any more.</p>
<p>Then the calculation changed. A short-haul flight emits several times more carbon per passenger than the equivalent rail journey, and travellers began to notice. Austrian operator ÖBB, which had bought up rolling stock other companies were discarding, found itself with an unexpectedly fashionable asset. Its Nightjet network expanded rather than contracted, and by the early 2020s new routes were being announced faster than carriages could be refurbished.</p>
<p>The economics remain awkward. A sleeper carriage carries far fewer passengers than a seated one, and it earns revenue only once per night while a high-speed train can make several daytime runs. Staffing costs are higher, and a delay at 3 a.m. is harder to recover from than one at midday. Several well-publicised startups have folded after a single season.</p>
<p>What has changed is not the arithmetic but the willingness of governments to subsidise the gap. Where a night train is treated as public infrastructure rather than a commercial product, the numbers work. Where it is not, enthusiasm alone has proved a poor substitute for a timetable that runs reliably in February.</p>`,
      questions: [
        {
          number: 11,
          type: 'SINGLE_CHOICE',
          content: 'What does the writer suggest about sleeper trains before 2015?',
          choices: mc(
            'They were being withdrawn from service.',
            'They were more profitable than airlines.',
            'They were mainly used by tourists.',
            'They were faster than high-speed rail.',
            0,
          ),
          difficulty: 'EASY',
          tags: ['detail', 'main-idea'],
          explanation: 'Đoạn 1: "operators across Europe quietly retired their carriages".',
        },
        {
          number: 12,
          type: 'SINGLE_CHOICE',
          content: "Why was ÖBB's position described as 'unexpectedly fashionable'?",
          choices: mc(
            'It had invested in high-speed trains.',
            'It had kept stock that others discarded.',
            'It had lowered its ticket prices.',
            'It had merged with an airline.',
            1,
          ),
          difficulty: 'MEDIUM',
          tags: ['inference', 'vocabulary'],
        },
        {
          number: 13,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Night trains earn less revenue per carriage than daytime services.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false', 'detail'],
        },
        {
          number: 14,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Most night train startups since 2020 have been profitable.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'HARD',
          tags: ['true-false', 'inference'],
        },
        {
          number: 15,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'ÖBB employs more staff than any other European rail operator.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false'],
        },
        {
          number: 16,
          type: 'SINGLE_CHOICE',
          content: "In the final paragraph, what does the writer identify as the decisive factor?",
          choices: mc(
            'Passenger demand',
            'Government subsidy',
            'Carriage design',
            'Airline competition',
            1,
          ),
          difficulty: 'MEDIUM',
          tags: ['main-idea', 'inference'],
        },
        {
          number: 17,
          type: 'FILL_BLANK',
          content:
            'Complete the sentence with ONE WORD from the passage: A short-haul flight emits more ________ per passenger than the equivalent rail journey.',
          correctText: ['carbon'],
          difficulty: 'EASY',
          tags: ['vocabulary', 'detail'],
        },
        {
          number: 18,
          type: 'FILL_BLANK',
          content:
            'Complete the sentence with ONE WORD from the passage: The writer argues a night train works financially when treated as public ________.',
          correctText: ['infrastructure'],
          difficulty: 'MEDIUM',
          tags: ['vocabulary', 'detail'],
        },
        {
          number: 19,
          type: 'SINGLE_CHOICE',
          content: "What does 'the arithmetic' refer to in the final paragraph?",
          choices: mc(
            'The number of passengers',
            'The cost structure of night trains',
            'The carbon emissions data',
            'The published timetable',
            1,
          ),
          difficulty: 'HARD',
          tags: ['reference', 'inference'],
        },
        {
          number: 20,
          type: 'SINGLE_CHOICE',
          content: 'What is the overall tone of the passage?',
          choices: mc(
            'Dismissive',
            'Cautiously realistic',
            'Openly nostalgic',
            'Strongly promotional',
            1,
          ),
          difficulty: 'HARD',
          tags: ['tone', 'attitude'],
        },
      ],
    },
  ],
}

// ============================================================================
// TOPIK
// ============================================================================

const topikListening: SeedSection = {
  skill: 'LISTENING',
  title: '듣기 (Nghe) — Phần 1',
  instructions:
    'Nghe và chọn đáp án đúng. Mỗi đoạn chỉ phát MỘT LẦN, giống điều kiện thi thật.',
  duration: 12 * 60,
  audioUrl: '/audio/topik-listening-part1.wav',
  audioPlayMode: 'ONCE_NO_SEEK',
  transcript: '개발 환경용 샘플 스크립트입니다. (Bản ghi mẫu dùng cho môi trường phát triển.)',
  questions: [
    {
      number: 1,
      type: 'SINGLE_CHOICE',
      content: '다음을 듣고 알맞은 대답을 고르십시오: "지금 어디에 가요?"',
      choices: mc('학교에 가요.', '어제 갔어요.', '친구예요.', '네, 좋아요.', 0),
      difficulty: 'EASY',
      tags: ['daily-conversation'],
    },
    {
      number: 2,
      type: 'SINGLE_CHOICE',
      content: '여자는 무엇을 살 거예요?',
      choices: mc('사과', '우유', '빵', '커피', 2),
      difficulty: 'EASY',
      tags: ['detail'],
    },
    {
      number: 3,
      type: 'SINGLE_CHOICE',
      content: '두 사람은 언제 만날 거예요?',
      choices: mc('오늘 오후', '내일 아침', '내일 저녁', '토요일', 2),
      difficulty: 'MEDIUM',
      tags: ['time', 'detail'],
    },
    {
      number: 4,
      type: 'SINGLE_CHOICE',
      content: '남자가 전화한 이유는 무엇입니까?',
      choices: mc('약속을 미루려고', '길을 물어보려고', '예약을 하려고', '주문을 취소하려고', 0),
      difficulty: 'MEDIUM',
      tags: ['purpose'],
    },
    {
      number: 5,
      type: 'SINGLE_CHOICE',
      content: '여기는 어디입니까?',
      choices: mc('은행', '병원', '우체국', '식당', 1),
      difficulty: 'EASY',
      tags: ['place', 'inference'],
    },
    {
      number: 6,
      type: 'SINGLE_CHOICE',
      content: '남자의 기분은 어떻습니까?',
      choices: mc('기쁩니다', '화가 납니다', '걱정합니다', '피곤합니다', 2),
      difficulty: 'MEDIUM',
      tags: ['attitude'],
    },
    {
      number: 7,
      type: 'SINGLE_CHOICE',
      content: '들은 내용과 같은 것을 고르십시오.',
      choices: mc(
        '여자는 회사에 다닙니다.',
        '여자는 학생입니다.',
        '남자는 요리사입니다.',
        '남자는 유학생입니다.',
        1,
      ),
      difficulty: 'MEDIUM',
      tags: ['detail'],
    },
    {
      number: 8,
      type: 'SINGLE_CHOICE',
      content: '여자는 앞으로 무엇을 하겠습니까?',
      choices: mc('집에 갑니다', '표를 삽니다', '친구를 기다립니다', '전화를 겁니다', 1),
      difficulty: 'HARD',
      tags: ['prediction', 'inference'],
    },
    {
      number: 9,
      type: 'SINGLE_CHOICE',
      content: '이 이야기의 중심 내용은 무엇입니까?',
      choices: mc('교통 안내', '날씨 예보', '행사 소개', '상품 광고', 2),
      difficulty: 'HARD',
      tags: ['main-idea'],
    },
    {
      number: 10,
      type: 'SINGLE_CHOICE',
      content: '표는 얼마입니까?',
      choices: mc('5,000원', '10,000원', '15,000원', '20,000원', 2),
      difficulty: 'EASY',
      tags: ['numbers', 'detail'],
    },
  ],
}

const topikReading: SeedSection = {
  skill: 'READING',
  title: '읽기 (Đọc) — Phần 1',
  instructions: '다음을 읽고 물음에 답하십시오. (Đọc đoạn văn và trả lời câu hỏi.)',
  duration: 18 * 60,
  passages: [
    {
      title: '도시의 작은 정원',
      content: `<p>요즘 서울의 옥상에는 작은 정원이 늘고 있다. 예전에는 비어 있던 건물 옥상에 주민들이 함께 채소를 심고 꽃을 가꾼다. 이런 공간을 '도시 텃밭'이라고 부른다.</p>
<p>도시 텃밭은 단순히 먹을거리를 얻기 위한 곳이 아니다. 이웃과 이야기를 나누는 장소가 되기도 하고, 아이들이 자연을 배우는 교실이 되기도 한다. 한 조사에 따르면 텃밭 활동에 참여한 주민의 70퍼센트 이상이 이웃과 더 가까워졌다고 답했다.</p>
<p>물론 문제도 있다. 물을 주고 관리하는 일에는 시간과 노력이 필요하다. 여름에는 벌레가 많이 생기고, 겨울에는 대부분의 작물이 자라지 않는다. 그래서 처음에 열심히 참여하던 사람들이 몇 달 뒤에는 나오지 않는 경우도 많다.</p>
<p>전문가들은 텃밭이 오래 유지되려면 한두 사람의 열정보다 함께 관리하는 규칙이 더 중요하다고 말한다.</p>`,
      questions: [
        {
          number: 11,
          type: 'SINGLE_CHOICE',
          content: '이 글의 중심 내용으로 알맞은 것을 고르십시오.',
          choices: mc(
            '도시 텃밭의 의미와 어려움',
            '옥상 건축의 역사',
            '채소를 기르는 방법',
            '서울의 인구 변화',
            0,
          ),
          difficulty: 'MEDIUM',
          tags: ['main-idea'],
        },
        {
          number: 12,
          type: 'SINGLE_CHOICE',
          content: "'도시 텃밭'은 무엇입니까?",
          choices: mc(
            '건물 안의 화원',
            '옥상에 만든 작은 밭',
            '공원의 놀이터',
            '학교의 실험실',
            1,
          ),
          difficulty: 'EASY',
          tags: ['vocabulary', 'detail'],
        },
        {
          number: 13,
          type: 'SINGLE_CHOICE',
          content: '조사 결과에 따르면 참여 주민의 70퍼센트 이상은 무엇을 느꼈습니까?',
          choices: mc(
            '채소값이 내려갔다',
            '이웃과 가까워졌다',
            '건강이 좋아졌다',
            '시간이 부족하다',
            1,
          ),
          difficulty: 'EASY',
          tags: ['detail', 'numbers'],
        },
        {
          number: 14,
          type: 'SINGLE_CHOICE',
          content: '글에서 말한 텃밭의 어려움이 아닌 것은 무엇입니까?',
          choices: mc(
            '여름에 벌레가 생긴다',
            '겨울에 작물이 자라지 않는다',
            '관리에 시간이 든다',
            '땅값이 너무 비싸다',
            3,
          ),
          difficulty: 'MEDIUM',
          tags: ['detail', 'negative'],
        },
        {
          number: 15,
          type: 'SINGLE_CHOICE',
          content: '전문가들이 강조한 것은 무엇입니까?',
          choices: mc('개인의 열정', '함께 지키는 규칙', '정부의 지원', '새로운 기술', 1),
          difficulty: 'MEDIUM',
          tags: ['detail', 'conclusion'],
        },
        {
          number: 16,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: '텃밭에 참여한 사람들이 모두 끝까지 활동을 계속한다.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false'],
        },
        {
          number: 17,
          type: 'FILL_BLANK',
          content: '빈칸에 알맞은 단어를 쓰십시오: 옥상에 만든 작은 밭을 도시 ________(이)라고 부른다.',
          correctText: ['텃밭'],
          difficulty: 'EASY',
          tags: ['vocabulary'],
        },
        {
          number: 18,
          type: 'SINGLE_CHOICE',
          content: '이 글을 쓴 목적은 무엇입니까?',
          choices: mc('광고하려고', '설명하려고', '항의하려고', '사과하려고', 1),
          difficulty: 'MEDIUM',
          tags: ['purpose'],
        },
        {
          number: 19,
          type: 'SINGLE_CHOICE',
          content: '텃밭이 아이들에게 주는 것은 무엇입니까?',
          choices: mc('운동 시설', '자연을 배우는 기회', '용돈', '숙제', 1),
          difficulty: 'EASY',
          tags: ['detail'],
        },
        {
          number: 20,
          type: 'SINGLE_CHOICE',
          content: '글쓴이의 태도로 알맞은 것은 무엇입니까?',
          choices: mc('비판적이다', '균형적이다', '무관심하다', '부정적이다', 1),
          difficulty: 'HARD',
          tags: ['attitude', 'tone'],
        },
      ],
    },
  ],
}

// ============================================================================
// THPT QUỐC GIA — Tiếng Anh
// ============================================================================

const thptListening: SeedSection = {
  skill: 'LISTENING',
  title: 'Phần 1 — Nghe hiểu',
  instructions:
    'Nghe đoạn ghi âm và chọn phương án đúng. Ở chế độ Thi thật, audio chỉ phát một lần.',
  duration: 10 * 60,
  audioUrl: '/audio/thpt-listening-part1.wav',
  audioPlayMode: 'ONCE_NO_SEEK',
  transcript: 'Bản ghi mẫu dùng cho môi trường phát triển.',
  questions: [
    {
      number: 1,
      type: 'SINGLE_CHOICE',
      content: 'What is the conversation mainly about?',
      choices: mc('A school project', 'A summer job', 'A family trip', 'A sports match', 0),
      difficulty: 'EASY',
      tags: ['main-idea'],
    },
    {
      number: 2,
      type: 'SINGLE_CHOICE',
      content: 'When is the deadline?',
      choices: mc('Monday', 'Wednesday', 'Friday', 'Sunday', 2),
      difficulty: 'EASY',
      tags: ['detail', 'time'],
    },
    {
      number: 3,
      type: 'SINGLE_CHOICE',
      content: 'What does the girl offer to do?',
      choices: mc('Write the report', 'Make the slides', 'Contact the teacher', 'Book a room', 1),
      difficulty: 'MEDIUM',
      tags: ['detail'],
    },
    {
      number: 4,
      type: 'SINGLE_CHOICE',
      content: 'How does the boy feel about the plan?',
      choices: mc('Worried', 'Relieved', 'Annoyed', 'Bored', 1),
      difficulty: 'MEDIUM',
      tags: ['attitude'],
    },
    {
      number: 5,
      type: 'SINGLE_CHOICE',
      content: 'Where will they meet?',
      choices: mc('At the library', 'At the canteen', 'At the gym', 'At the bus stop', 0),
      difficulty: 'EASY',
      tags: ['place', 'detail'],
    },
    {
      number: 6,
      type: 'SINGLE_CHOICE',
      content: 'How many students are in the group?',
      choices: mc('Three', 'Four', 'Five', 'Six', 1),
      difficulty: 'EASY',
      tags: ['numbers'],
    },
    {
      number: 7,
      type: 'SINGLE_CHOICE',
      content: 'What problem do they mention?',
      choices: mc(
        'They lack information.',
        'They lost their notes.',
        'They cannot meet in person.',
        'They disagree on the topic.',
        0,
      ),
      difficulty: 'MEDIUM',
      tags: ['problem', 'detail'],
    },
    {
      number: 8,
      type: 'SINGLE_CHOICE',
      content: 'What will the boy do next?',
      choices: mc('Go home', 'Visit the library', 'Call his mother', 'Start writing', 1),
      difficulty: 'HARD',
      tags: ['prediction'],
    },
    {
      number: 9,
      type: 'SINGLE_CHOICE',
      content: 'Which subject is the project for?',
      choices: mc('History', 'Biology', 'Geography', 'Literature', 2),
      difficulty: 'MEDIUM',
      tags: ['detail'],
    },
    {
      number: 10,
      type: 'SINGLE_CHOICE',
      content: 'What advice does the teacher give?',
      choices: mc(
        'Start early',
        'Work individually',
        'Use more images',
        'Keep it short',
        0,
      ),
      difficulty: 'MEDIUM',
      tags: ['detail', 'advice'],
    },
  ],
}

const thptReading: SeedSection = {
  skill: 'READING',
  title: 'Phần 2 — Đọc hiểu',
  instructions: 'Đọc đoạn văn và chọn phương án đúng cho mỗi câu hỏi.',
  duration: 25 * 60,
  passages: [
    {
      title: 'Why cities are planting more trees',
      content: `<p>Walk down a street lined with mature trees on a hot afternoon and the difference is immediate. Air temperature under a good canopy can be several degrees lower than on an identical street without one, and the surface of the pavement itself can be more than twenty degrees cooler. In cities where summer heat now regularly threatens health, that gap is no longer a matter of comfort.</p>
<p>Urban trees do more than provide shade. Their leaves intercept rainfall, slowing the rush of water into drains during storms. They trap particulate pollution, absorb a modest amount of carbon, and, according to a growing body of research, measurably reduce stress in people who live near them. Property values on tree-lined streets are consistently higher, which is why developers who once cleared sites now advertise their canopy.</p>
<p>Planting a tree, however, is the easy part. A sapling in a city faces compacted soil, restricted root space, road salt, and drought. Studies of urban planting schemes have found that a substantial share of new trees die within their first five years, usually because nobody was responsible for watering them once the ribbon-cutting was over. A dead sapling delivers none of the benefits above and costs more to remove than it did to plant.</p>
<p>The cities that succeed tend to be the ones that budget for maintenance rather than for announcements. They choose species suited to the local climate rather than to fashion, give roots genuine space beneath the pavement, and assign someone specific the unglamorous job of keeping young trees alive through their third dry summer.</p>`,
      questions: [
        {
          number: 11,
          type: 'SINGLE_CHOICE',
          content: 'According to the first paragraph, why does shade matter more than before?',
          choices: mc(
            'Cities have fewer parks.',
            'Summer heat now threatens health.',
            'Pavements are more expensive.',
            'People walk more often.',
            1,
          ),
          difficulty: 'EASY',
          tags: ['detail', 'cause-effect'],
        },
        {
          number: 12,
          type: 'SINGLE_CHOICE',
          content: 'Which benefit of urban trees is NOT mentioned?',
          choices: mc(
            'Slowing storm water',
            'Trapping pollution',
            'Producing food',
            'Reducing stress',
            2,
          ),
          difficulty: 'MEDIUM',
          tags: ['detail', 'negative'],
        },
        {
          number: 13,
          type: 'SINGLE_CHOICE',
          content: 'Why do developers now advertise tree canopy?',
          choices: mc(
            'It is required by law.',
            'It raises property values.',
            'It reduces building costs.',
            'It speeds up construction.',
            1,
          ),
          difficulty: 'MEDIUM',
          tags: ['cause-effect', 'detail'],
        },
        {
          number: 14,
          type: 'SINGLE_CHOICE',
          content: 'What is the main reason many new urban trees die?',
          choices: mc(
            'They are the wrong species.',
            'They are planted too deep.',
            'Nobody takes responsibility for watering.',
            'They are damaged by traffic.',
            2,
          ),
          difficulty: 'MEDIUM',
          tags: ['cause-effect', 'main-idea'],
        },
        {
          number: 15,
          type: 'SINGLE_CHOICE',
          content: "What does the writer mean by 'budget for maintenance rather than for announcements'?",
          choices: mc(
            'Publicity is more expensive than care.',
            'Long-term care matters more than launch events.',
            'Cities should stop planting trees.',
            'Maintenance should be privately funded.',
            1,
          ),
          difficulty: 'HARD',
          tags: ['inference', 'vocabulary'],
        },
        {
          number: 16,
          type: 'SINGLE_CHOICE',
          content: "The word 'unglamorous' in the last paragraph is closest in meaning to:",
          choices: mc('dangerous', 'unrewarding in appearance', 'highly skilled', 'poorly paid', 1),
          difficulty: 'HARD',
          tags: ['vocabulary'],
        },
        {
          number: 17,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Removing a dead sapling costs more than planting it.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false', 'detail'],
        },
        {
          number: 18,
          type: 'FILL_BLANK',
          content:
            'Complete with ONE WORD from the passage: Successful cities choose species suited to the local ________ rather than to fashion.',
          correctText: ['climate'],
          difficulty: 'EASY',
          tags: ['vocabulary', 'detail'],
        },
        {
          number: 19,
          type: 'SINGLE_CHOICE',
          content: 'What is the writer’s main purpose?',
          choices: mc(
            'To criticise city governments',
            'To explain what makes tree planting actually work',
            'To describe the biology of trees',
            'To promote a specific species',
            1,
          ),
          difficulty: 'MEDIUM',
          tags: ['purpose', 'main-idea'],
        },
        {
          number: 20,
          type: 'SINGLE_CHOICE',
          content: 'Which statement would the writer most likely agree with?',
          choices: mc(
            'Planting targets are the best measure of success.',
            'Survival rates matter more than planting numbers.',
            'Trees are unsuitable for dense cities.',
            'Maintenance should be left to residents.',
            1,
          ),
          difficulty: 'HARD',
          tags: ['inference', 'attitude'],
        },
      ],
    },
  ],
}

// ============================================================================
// GOETHE-ZERTIFIKAT
//
// KHÁC với ba kỳ thi phía trên: nội dung dưới đây KHÔNG phải tự biên soạn.
// Đây là đề thật của Goethe-Institut (Modellsatz / Übungssatz), bóc từ bộ PDF
// chính thức, © Goethe-Institut. Provenance 'goethe-institut' giữ phần ghi
// nguồn — xem prisma/seed.ts.
//
// Hai chỗ cố ý lược bớt so với bản in:
//  1. Tranh minh hoạ ở Hören Teil 1 (giá áo len, mặt đồng hồ, đĩa thức ăn…).
//     Phương án trả lời đã ghi rõ bằng chữ ("Dreißig Euro", "15 Uhr", "Pommes")
//     nên bỏ tranh không làm mất thông tin để giải — đáp án nằm ở file nghe.
//  2. Thẻ từ / thẻ tranh của Sprechen: đề gốc là thi nói theo nhóm, không chấm
//     tự động được. Giữ lại nguyên đề bài dưới dạng câu SPEAKING để người học
//     tự luyện; engine đánh isCorrect = null và loại khỏi tổng điểm.
// ============================================================================

/** Hai lựa chọn Richtig/Falsch — dạng câu chiếm phần lớn đề A1/A2. */
function rf(correct: 'Richtig' | 'Falsch') {
  return [
    { label: 'A', content: 'Richtig', isCorrect: correct === 'Richtig' },
    { label: 'B', content: 'Falsch', isCorrect: correct === 'Falsch' },
  ]
}

/** Ba lựa chọn a/b/c — dạng câu của Hören Teil 1 và Teil 3. */
function abc(a: string, b: string, c: string, correctIndex: 0 | 1 | 2) {
  return ['a', 'b', 'c'].map((label, i) => ({
    label,
    content: [a, b, c][i],
    isCorrect: i === correctIndex,
  }))
}

/** Hai lựa chọn a/b — dạng câu của Lesen Teil 2. */
function ab(a: string, b: string, correctIndex: 0 | 1) {
  return ['a', 'b'].map((label, i) => ({
    label,
    content: [a, b][i],
    isCorrect: i === correctIndex,
  }))
}

const sd1Hoeren: SeedSection = {
  skill: 'LISTENING',
  title: 'Hören',
  instructions:
    'Dieser Test hat drei Teile. Sie hören kurze Gespräche und Ansagen. Zu jedem Text gibt es eine Aufgabe. Lesen Sie zuerst die Aufgabe, hören Sie dann den Text dazu. Kreuzen Sie die richtige Lösung an.',
  duration: 20 * 60,
  /**
   * File nghe là MP4 — bộ tài liệu gốc phát hành phần Hören dưới dạng video.
   * Thẻ <audio> phát được luồng tiếng trong container MP4 nên không cần tách.
   *
   * CHƯA XÁC NHẬN ĐÚNG ĐỀ: file gốc đánh số `pruefungstraining_1|2|3_hoeren_a1`
   * còn PDF đặt tên `modellsatz | uebungssatz01 | uebungssatz02`, không có chỗ
   * nào nối hai cách đặt tên đó lại. Ở đây gán theo thứ tự (1 → Modellsatz).
   * Nghe thử một câu rồi đối chiếu với transcript bên dưới để chốt lại.
   */
  audioUrl: '/audio/goethe-a1-hoeren-1.mp4',
  audioPlayMode: 'ONCE_NO_SEEK',
  transcript: `Teil 1 — Was ist richtig? Sie hören jeden Text zweimal.

Beispiel
Frau: Ach, Verzeihung, wo finde ich Herrn Schneider vom Betriebsrat?
Mann: Schneider. Warten Sie mal. Ich glaube, der ist in Zimmer Nummer 254. Ja, stimmt, Zimmer 254. Das ist im zweiten Stock. Da können Sie den Aufzug hier nehmen.
Frau: Zweiter Stock, Zimmer 254. Okay, vielen Dank.

Nummer 1
Kunde: Entschuldigung, was kostet dieser Pullover jetzt? Da steht 30 Prozent billiger.
Verkäuferin: Einen Moment bitte … neunzehnfünfundneunzig.
Kunde: 19,95 Euro?
Verkäuferin: Ja, Euro natürlich.
Kunde: Hm, … ok, den nehme ich.

Nummer 2
Passant: Ach, entschuldigen Sie bitte.
Passantin: Ja bitte.
Passant: Haben Sie eine Uhr? … Wie spät ist es bitte?
Passantin: Ja – jetzt ist es gleich 5 Uhr.
Passant: Was, schon 5. Vielen Dank, Wiedersehen.

Nummer 3
Kellner: Was wünschen Sie bitte?
Gast: Ich hätte gern die Salatplatte und ein …
Kellner: Entschuldigung, die Salatplatte ist leider aus, aber die Bratwurst kann ich Ihnen empfehlen … ganz frisch heute.
Gast: Nein danke … ich esse kein Fleisch. Gibt es etwas ohne Fleisch?
Kellner: Ja … nicht mehr viel: Fisch oder … Pommes.
Gast: Fisch … hm … Tja, dann wohl die Pommes.

Nummer 4
Kollege: Haben Sie Kinder, Frau Heger?
Kollegin: Ja, einen Sohn.
Kollege: Und wie alt ist er?
Kollegin: Neun Jahre … seit gestern.
Kollege: Ah, dann geht er ja schon zur Schule?
Kollegin: Ja klar, schon in die dritte Klasse.

Nummer 5
Kundin: Ach, entschuldigen Sie, wie komme ich denn hier in den zweiten Stock? Die Rolltreppe da vorn ist kaputt.
Verkäufer: Da gehen Sie hier rechts um die Ecke und nehmen den Aufzug.
Kundin: Um die Ecke rechts. Danke.

Nummer 6
Kollegin: Guten Morgen, Herr Albers. So früh schon bei der Arbeit?
Kollege: Ja, ich habe noch viel zu tun. Morgen fahre ich doch für 3 Wochen weg.
Kollegin: Ach ja, das hab' ich vergessen. Wohin fahren Sie denn?
Kollege: Zu meinen Verwandten nach Polen.
Kollegin: Na dann … schöne Zeit.

Teil 2 — Richtig oder Falsch? Sie hören jeden Text einmal.

Beispiel
Frau Katrin Gundlach, angekommen aus Budapest, wird zum Informationsschalter in der Ankunftshalle C gebeten. Frau Gundlach bitte zum Informationsschalter in der Ankunftshalle C.

Nummer 7
Liebe Kunden, zu Weihnachten bieten wir Ihnen Superpreise an … z. B. erstklassiger italienischer Weißwein für 12 Euro 78 die Flasche oder exklusiver argentinischer Rotwein für 9 Euro 68. Besuchen Sie uns im 3. Stock. Frohe Weihnachten.

Nummer 8
Liebe Fahrgäste. Wir sind kurz vor Würzburg. Sicherlich haben Sie schon Hunger. An der nächsten Raststätte halten wir für eine Stunde. Wir treffen uns wieder um halb eins am Bus, aber bitte pünktlich sein.

Nummer 9
Liebe Fahrgäste! Bitte beachten Sie. Das ist ein außerplanmäßiger Halt. Bitte hier nicht aussteigen. In ein paar Minuten erreichen wir den Bahnhof Bonn – Bad Godesberg.

Nummer 10
Herr Stefan Janda gebucht auf dem Flug LH 737 nach Warschau, wird zum Schalter F7 gebeten. Der Flug wird in ein paar Minuten geschlossen. Herr Janda gebucht nach Warschau bitte nach F7.

Teil 3 — Was ist richtig? Sie hören jeden Text zweimal.

Nummer 11
Telefonansagedienst der deutschen Telekom. Die Rufnummer des Teilnehmers hat sich geändert. Bitte rufen Sie die Telefon-Auskunft an unter 11 8 33.

Nummer 12
Hallo Jan, hier ist Boris. Du, ich bin noch im Zug. Du holst mich doch vom Bahnhof ab? Ich warte an der Information auf dich.

Nummer 13
Mensch Jan, du Penner, hier noch mal Boris. Ich bin jetzt am Bahnhof. Und du? Wo bist du denn? Ich warte schon über 20 Minuten auf dich. Zehn Minuten Zeit hast du noch … bis 2, dann nehme ich ein Taxi.

Nummer 14
Guten Tag, hier Rogalla. Wir können am Samstag leider nicht zu Ihnen kommen. Am Sonntag haben wir aber Zeit. Rufen Sie uns doch bitte zurück, ob Ihnen das passt. Danke.

Nummer 15
Hallo Alex. Walter hier. Kannst du schnell mal rüberkommen? Mein Computer hat einen Fehler. Ich kann nichts drucken. Melde dich doch bitte gleich, wenn du nach Hause kommst.`,
  questions: [
    // --- Teil 1: Was ist richtig? Sie hören jeden Text zweimal. ---
    {
      number: 1,
      type: 'SINGLE_CHOICE',
      content: 'Teil 1 — Was kostet der Pullover?',
      choices: abc('Dreißig Euro.', 'Fünfundneunzig Euro.', 'Neunzehn Euro fünfundneunzig Cent.', 2),
      difficulty: 'EASY',
      tags: ['hoeren', 'teil-1', 'zahlen'],
      explanation: 'Der Verkäufer sagt „neunzehnfünfundneunzig". Die 30 im Text ist der Rabatt, nicht der Preis.',
    },
    {
      number: 2,
      type: 'SINGLE_CHOICE',
      content: 'Teil 1 — Wie spät ist es?',
      choices: abc('15 Uhr.', 'Gleich 5 Uhr.', 'Halb 5 Uhr.', 1),
      difficulty: 'EASY',
      tags: ['hoeren', 'teil-1', 'uhrzeit'],
      explanation: '„Ja – jetzt ist es gleich 5 Uhr."',
    },
    {
      number: 3,
      type: 'SINGLE_CHOICE',
      content: 'Teil 1 — Was isst die Frau im Restaurant?',
      choices: abc('Pommes.', 'Fisch.', 'Wurst.', 0),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-1', 'essen'],
      explanation: 'Salatplatte ist aus, Fleisch isst sie nicht, Fisch will sie nicht — „dann wohl die Pommes".',
    },
    {
      number: 4,
      type: 'SINGLE_CHOICE',
      content: 'Teil 1 — In welche Klasse geht Frau Hegers Sohn?',
      choices: abc('In die neunte Klasse.', 'In die dritte Klasse.', 'In die vierte Klasse.', 1),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-1', 'zahlen'],
      explanation: 'Neun Jahre ist das Alter; „schon in die dritte Klasse" ist die Klasse.',
    },
    {
      number: 5,
      type: 'SINGLE_CHOICE',
      content: 'Teil 1 — Wie kommt die Frau in den 2. Stock?',
      choices: abc('Mit dem Aufzug.', 'Auf der Treppe um die Ecke.', 'Mit der Rolltreppe.', 0),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-1', 'orientierung'],
      explanation: 'Die Rolltreppe ist kaputt; sie soll um die Ecke gehen und den Aufzug nehmen.',
    },
    {
      number: 6,
      type: 'SINGLE_CHOICE',
      content: 'Teil 1 — Wohin fährt Herr Albers?',
      choices: abc('In Urlaub ans Meer.', 'Zur Arbeit.', 'Zur Familie.', 2),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-1', 'reisen'],
      explanation: '„Zu meinen Verwandten nach Polen" — also zur Familie.',
    },

    // --- Teil 2: Richtig oder Falsch? Sie hören jeden Text einmal. ---
    {
      number: 7,
      type: 'SINGLE_CHOICE',
      content: 'Teil 2 — Die Kunden sollen die Weihnachtsfeier besuchen.',
      choices: rf('Falsch'),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-2', 'ansage'],
      explanation: 'Die Ansage lädt zum Wein-Angebot im 3. Stock ein, nicht zu einer Feier.',
    },
    {
      number: 8,
      type: 'SINGLE_CHOICE',
      content: 'Teil 2 — Die Fahrgäste sollen sich im Restaurant treffen.',
      choices: rf('Falsch'),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-2', 'ansage'],
      explanation: '„Wir treffen uns wieder um halb eins am Bus."',
    },
    {
      number: 9,
      type: 'SINGLE_CHOICE',
      content: 'Teil 2 — Die Fahrgäste sollen im Zug bleiben.',
      choices: rf('Richtig'),
      difficulty: 'EASY',
      tags: ['hoeren', 'teil-2', 'ansage'],
      explanation: '„Das ist ein außerplanmäßiger Halt. Bitte hier nicht aussteigen."',
    },
    {
      number: 10,
      type: 'SINGLE_CHOICE',
      content: 'Teil 2 — Der Herr soll sofort zum Schalter kommen.',
      choices: rf('Richtig'),
      difficulty: 'EASY',
      tags: ['hoeren', 'teil-2', 'ansage'],
      explanation: 'Herr Janda wird zum Schalter F7 gebeten, der Flug wird gleich geschlossen.',
    },

    // --- Teil 3: Was ist richtig? Sie hören jeden Text zweimal. ---
    {
      number: 11,
      type: 'SINGLE_CHOICE',
      content: 'Teil 3 — Die Nummer ist:',
      choices: abc('11833.', '11883.', '12833.', 0),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-3', 'zahlen'],
      explanation: '„… unter 11 8 33."',
    },
    {
      number: 12,
      type: 'SINGLE_CHOICE',
      content: 'Teil 3 — Wo genau treffen sich die Männer?',
      choices: abc('Am Zug.', 'Am Bahnhof.', 'An der Information.', 2),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-3', 'ort'],
      explanation: '„Ich warte an der Information auf dich." — genauer als nur „am Bahnhof".',
    },
    {
      number: 13,
      type: 'SINGLE_CHOICE',
      content: 'Teil 3 — Wie lange will der Mann noch warten?',
      choices: abc('20 Minuten.', '2 Minuten.', '10 Minuten.', 2),
      difficulty: 'HARD',
      tags: ['hoeren', 'teil-3', 'zahlen'],
      explanation: 'Er hat schon 20 Minuten gewartet; noch bleiben „Zehn Minuten Zeit".',
    },
    {
      number: 14,
      type: 'SINGLE_CHOICE',
      content: 'Teil 3 — An welchem Tag will die Frau kommen?',
      choices: abc('Am Montag.', 'Am Sonntag.', 'Am Samstag.', 1),
      difficulty: 'MEDIUM',
      tags: ['hoeren', 'teil-3', 'termin'],
      explanation: 'Samstag geht nicht, „am Sonntag haben wir aber Zeit".',
    },
    {
      number: 15,
      type: 'SINGLE_CHOICE',
      content: 'Teil 3 — Was ist kaputt?',
      choices: abc('Der Fernseher.', 'Der Computer.', 'Das Handy.', 1),
      difficulty: 'EASY',
      tags: ['hoeren', 'teil-3', 'technik'],
      explanation: '„Mein Computer hat einen Fehler. Ich kann nichts drucken."',
    },
  ],
}

const sd1Lesen: SeedSection = {
  skill: 'READING',
  title: 'Lesen',
  instructions:
    'Dieser Test hat drei Teile. Sie lesen kurze Briefe, Anzeigen etc. Zu jedem Text gibt es Aufgaben. Kreuzen Sie die richtige Lösung an.',
  duration: 25 * 60,
  passages: [
    {
      title: 'Teil 1 — E-Mail von Karin',
      content: `<p><strong>Betreff:</strong> Hallo Li,</p>
<p>danke für deine Mail. Dein Zug kommt hier in Hannover um 12.36 Uhr an. Ich bin ab 12.15 Uhr im Hauptbahnhof und warte auf dich vor der Auskunft.</p>
<p>Du kannst mich den ganzen Vormittag auf meinem Handy (++49 173 62 205 59) erreichen.</p>
<p>Deine<br>Karin</p>`,
      questions: [
        {
          number: 1,
          type: 'SINGLE_CHOICE',
          content: 'Lis Zug kommt nach halb eins an.',
          choices: rf('Richtig'),
          difficulty: 'MEDIUM',
          tags: ['lesen', 'teil-1', 'uhrzeit'],
          explanation: '12.36 Uhr liegt nach 12.30 Uhr (halb eins).',
        },
        {
          number: 2,
          type: 'SINGLE_CHOICE',
          content: 'Karin wartet den ganzen Vormittag vor der Auskunft.',
          choices: rf('Falsch'),
          difficulty: 'MEDIUM',
          tags: ['lesen', 'teil-1', 'detail'],
          explanation: 'Sie ist ab 12.15 Uhr da. Den ganzen Vormittag ist sie nur auf dem Handy erreichbar.',
        },
      ],
    },
    {
      title: 'Teil 1 — Einladung von Ralf',
      content: `<p>Liebe Carmen,</p>
<p>am kommenden Sonntag habe ich Geburtstag. Ich möchte gerne mit dir feiern und lade dich herzlich zu meiner Party am Samstagabend ein. Wir fangen um 21 Uhr an. Ist das okay für dich? Es werden viele Leute da sein, die du auch kennst. Kannst du vielleicht einen Salat mitbringen? Und vergiss bitte nicht einen Pullover oder eine Jacke! Wir wollen nämlich draußen im Garten feiern. Ich freue mich sehr auf dich!</p>
<p>Bis zum Wochenende<br>Ralf</p>`,
      questions: [
        {
          number: 3,
          type: 'SINGLE_CHOICE',
          content: 'Ralf hatte am letzten Wochenende Geburtstag.',
          choices: rf('Falsch'),
          difficulty: 'EASY',
          tags: ['lesen', 'teil-1', 'detail'],
          explanation: '„Am kommenden Sonntag" — der Geburtstag liegt in der Zukunft.',
        },
        {
          number: 4,
          type: 'SINGLE_CHOICE',
          content: 'Ralf hat nur zwei oder drei Leute eingeladen.',
          choices: rf('Falsch'),
          difficulty: 'EASY',
          tags: ['lesen', 'teil-1', 'detail'],
          explanation: '„Es werden viele Leute da sein."',
        },
        {
          number: 5,
          type: 'SINGLE_CHOICE',
          content: 'Die Party findet draußen statt.',
          choices: rf('Richtig'),
          difficulty: 'EASY',
          tags: ['lesen', 'teil-1', 'detail'],
          explanation: '„Wir wollen nämlich draußen im Garten feiern."',
        },
      ],
    },
  ],
  questions: [
    // --- Teil 2: Wo finden Sie Informationen? a oder b ---
    {
      number: 6,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 2 — Sie möchten mit dem Schiff auf dem Rhein fahren.\n\na) www.schiff-ruedesheim.de — Hotel-Pension „Schiff": Einzel- und Doppelzimmer mit Dusche/WC, Restaurant mit Rhein-Terrasse. Preise · über uns · Buchung\n\nb) www.bingen-ruedesheimer.de — Bingen-Rüdesheimer Rheinschiffe: täglich von Rüdesheim nach Koblenz, alle Abfahrtszeiten und Preise hier',
      choices: ab('www.schiff-ruedesheim.de', 'www.bingen-ruedesheimer.de', 1),
      difficulty: 'EASY',
      tags: ['lesen', 'teil-2', 'anzeigen'],
      explanation: 'a) ist ein Hotel, das nur „Schiff" heißt. b) sind echte Rheinschiffe.',
    },
    {
      number: 7,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 2 — Sie möchten Deutsch in Deutschland lernen.\n\na) www.sprachenfuchs.de — Sprachinstitut Fuchs, Dresden, Prager Str. 4. Deutsch · Englisch · Französisch · Russisch. Die Schule · Die Preise · Die Kurse · Kontakt\n\nb) www.eviva.com — Eviva-Idiomas: Sprachkurse für Deutsche, Spanisch auf Mallorca, Englisch auf Malta. Unsere Preise · Unser Unterricht · Buchungen',
      choices: ab('www.sprachenfuchs.de', 'www.eviva.com', 0),
      difficulty: 'EASY',
      tags: ['lesen', 'teil-2', 'anzeigen'],
      explanation: 'a) bietet Deutsch in Dresden an; b) bietet Sprachen im Ausland für Deutsche.',
    },
    {
      number: 8,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 2 — Sie möchten ein Zugticket im Internet kaufen.\n\na) www.DER.com — Deutsches Reisebüro: Ticketbestellungen und Reservierungen für Flüge weltweit, Deutsche Bahn, Eurobus, 24-Stunden-Service. E-Mail · Ticketbestellung\n\nb) www.RED.com — Reisedienst GmbH: Ticketservice für Theater, Konzerte, Busreisen in Deutschland und nach Polen, Tschechien und Ungarn. Konzertservice · Theater · Busreisen',
      choices: ab('www.DER.com', 'www.RED.com', 0),
      difficulty: 'MEDIUM',
      tags: ['lesen', 'teil-2', 'anzeigen'],
      explanation: 'Nur a) nennt die Deutsche Bahn; b) verkauft Theater-, Konzert- und Bustickets.',
    },
    {
      number: 9,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 2 — Sie möchten Informationen über den Bodensee.\n\na) www.bodensee.de — Touristeninformation Bodensee: Urlaubsorte · Hotelservice · Ferienwohnungen · Rundreisen\n\nb) www.rottenmeier.de — Hans Rottenmeier, Ferienwohnungen am Bodensee: Häuser · Preise · Kontakt',
      choices: ab('www.bodensee.de', 'www.rottenmeier.de', 0),
      difficulty: 'EASY',
      tags: ['lesen', 'teil-2', 'anzeigen'],
      explanation: 'a) ist die allgemeine Touristeninformation; b) ist ein einzelner Vermieter.',
    },
    {
      number: 10,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 2 — Sie sind in Wiesbaden und möchten mit dem Zug am Mittag in Hamburg sein.\n\na) www.reiseauskunft.bahn.de — ab Hamburg 17.02. 12.18 Uhr, an Wiesbaden 17.02. 16.52 Uhr, Dauer 4:34, 1× umsteigen (ICE, S)\n\nb) www.reiseauskunft.bahn.de — ab Wiesbaden 17.02. 08.09 Uhr, an Hamburg 17.02. 12.40 Uhr, Dauer 4:31, 1× umsteigen (S, ICE)',
      choices: ab('Verbindung a', 'Verbindung b', 1),
      difficulty: 'MEDIUM',
      tags: ['lesen', 'teil-2', 'fahrplan'],
      explanation: 'b) fährt ab Wiesbaden und kommt um 12.40 Uhr in Hamburg an. a) fährt in die Gegenrichtung.',
    },

    // --- Teil 3: Schilder und Aushänge — Richtig oder Falsch ---
    {
      number: 11,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 3 — In der Sprachschule\n\n„In der 10-Uhr-Pause bekommen Sie an der Rezeption ein Frühstückspaket: Belegte Brötchen und Getränke für 2 Euro."\n\nIn der Sprachschule können Sie etwas zu essen kaufen.',
      choices: rf('Richtig'),
      difficulty: 'EASY',
      tags: ['lesen', 'teil-3', 'aushang'],
      explanation: 'Belegte Brötchen für 2 Euro — man kann also etwas zu essen kaufen.',
    },
    {
      number: 12,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 3 — An der Post\n\n„Öffnungszeiten: montags – freitags 8.00 – 12.00 und 13.00 – 18.00, samstags 8.00 – 12.00"\n\nEs ist Samstagnachmittag. Sie können auf der Post Briefmarken kaufen.',
      choices: rf('Falsch'),
      difficulty: 'MEDIUM',
      tags: ['lesen', 'teil-3', 'oeffnungszeiten'],
      explanation: 'Samstags ist nur bis 12.00 Uhr geöffnet, nachmittags also nicht.',
    },
    {
      number: 13,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 3 — Am Bahnhof\n\n„Auf dem gesamten Bahnhof ist das Rauchen verboten."\n\nSie können hier Zigaretten rauchen.',
      choices: rf('Falsch'),
      difficulty: 'EASY',
      tags: ['lesen', 'teil-3', 'schild'],
      explanation: 'Rauchen ist auf dem gesamten Bahnhof verboten.',
    },
    {
      number: 14,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 3 — Eingang Restaurant\n\n„Heute im Bavaria: Bayerischer Abend. Brezeln, Weißwürste, Sauerkraut. Volksmusik, ab 20 Uhr Tanz."\n\nHeute Abend können Sie in diesem Restaurant tanzen.',
      choices: rf('Richtig'),
      difficulty: 'EASY',
      tags: ['lesen', 'teil-3', 'aushang'],
      explanation: '„ab 20 Uhr Tanz".',
    },
    {
      number: 15,
      type: 'SINGLE_CHOICE',
      content:
        'Teil 3 — An der Haltestelle\n\n„In der Neujahrsnacht: Busverkehr bis 23.00 Uhr und von 1.00 Uhr bis 5.00 Uhr alle 30 Minuten."\n\nVon 23 Uhr bis 1 Uhr fährt kein Bus.',
      choices: rf('Richtig'),
      difficulty: 'MEDIUM',
      tags: ['lesen', 'teil-3', 'fahrplan'],
      explanation: 'Der Verkehr endet um 23.00 Uhr und beginnt erst um 1.00 Uhr wieder.',
    },
  ],
}

const sd1Schreiben: SeedSection = {
  skill: 'WRITING',
  title: 'Schreiben',
  instructions:
    'Dieser Test hat zwei Teile. Sie füllen ein Formular aus und schreiben einen kurzen Text. Wörterbücher sind nicht erlaubt.',
  duration: 20 * 60,
  questions: [
    {
      number: 1,
      type: 'SHORT_ANSWER',
      content:
        'Teil 1 — Ihre Freundin, Eva Kadavy, macht mit ihrem Mann und ihren beiden Söhnen (8 und 11 Jahre alt) Urlaub in Seeheim. Im Reisebüro bucht sie für den nächsten Sonntag eine Busfahrt um den Bodensee. Frau Kadavy hat keine Kreditkarte.\n\nFormular „Bodensee-Rundfahrt — Anmeldung", Feld (1) Anzahl der Personen:',
      correctText: ['4', 'vier'],
      difficulty: 'MEDIUM',
      tags: ['schreiben', 'teil-1', 'formular'],
      explanation: 'Eva, ihr Mann und zwei Söhne = 4 Personen.',
    },
    {
      number: 2,
      type: 'SHORT_ANSWER',
      content: 'Teil 1 — Feld (2) Davon Kinder:',
      correctText: ['2', 'zwei'],
      difficulty: 'EASY',
      tags: ['schreiben', 'teil-1', 'formular'],
      explanation: 'Die beiden Söhne sind 8 und 11 Jahre alt.',
    },
    {
      number: 3,
      type: 'SHORT_ANSWER',
      content: 'Teil 1 — Feld (3) PLZ, Urlaubsort (die PLZ 78014 steht schon da):',
      correctText: ['Seeheim'],
      difficulty: 'EASY',
      tags: ['schreiben', 'teil-1', 'formular'],
      explanation: 'Der Urlaub findet in Seeheim statt.',
    },
    {
      number: 4,
      type: 'SHORT_ANSWER',
      content: 'Teil 1 — Feld (4) Zahlungsweise (Bar oder Kreditkarte):',
      correctText: ['bar', 'Bar'],
      difficulty: 'MEDIUM',
      tags: ['schreiben', 'teil-1', 'formular'],
      explanation: 'Frau Kadavy hat keine Kreditkarte, also bleibt nur „bar".',
    },
    {
      number: 5,
      type: 'SHORT_ANSWER',
      content: 'Teil 1 — Feld (5) Reisetermin:',
      correctText: ['Sonntag', 'nächsten Sonntag', 'am nächsten Sonntag', 'kommenden Sonntag'],
      difficulty: 'MEDIUM',
      tags: ['schreiben', 'teil-1', 'formular'],
      explanation: 'Laut Lösungsschlüssel: Datum vom nächsten Sonntag / Sonntag / nächsten Sonntag.',
    },
    {
      number: 6,
      type: 'ESSAY',
      content:
        'Teil 2 — Sie möchten im August Dresden besuchen. Schreiben Sie an die Touristeninformation:\n— Warum schreiben Sie?\n— Bitten Sie: Informationen über Filme, Museen usw. (Kulturprogramm).\n— Fragen Sie: Hoteladressen?\n\nSchreiben Sie zu jedem Punkt ein bis zwei Sätze (circa 30 Wörter). Schreiben Sie auch eine Anrede und einen Gruß.',
      points: 10,
      difficulty: 'MEDIUM',
      tags: ['schreiben', 'teil-2', 'brief'],
      explanation:
        'Bewertung laut Goethe-Institut: pro Inhaltspunkt 3 / 1,5 / 0 Punkte (Aufgabe voll erfüllt / teilweise / nicht erfüllt), dazu 1 / 0,5 / 0 Punkte für die kommunikative Gestaltung (Anrede und Gruß). Maximal 10 Punkte.',
    },
  ],
}

const sd1Sprechen: SeedSection = {
  skill: 'SPEAKING',
  title: 'Sprechen',
  instructions:
    'Dieser Test hat drei Teile. Die mündliche Prüfung ist eine Gruppenprüfung mit maximal vier Teilnehmenden. Hier zum Selbstüben: sprechen Sie Ihre Antworten laut oder nehmen Sie sie auf. Diese Teile werden nicht automatisch bewertet.',
  duration: 15 * 60,
  questions: [
    {
      number: 1,
      type: 'SPEAKING',
      content:
        'Teil 1 — Sich vorstellen. Erzählen Sie: Wer sind Sie? Nutzen Sie die Stichwörter: Name? Alter? Land? Wohnort? Sprachen? Beruf? Hobby?',
      difficulty: 'EASY',
      tags: ['sprechen', 'teil-1', 'vorstellung'],
    },
    {
      number: 2,
      type: 'SPEAKING',
      content:
        'Teil 2 — Um Informationen bitten und Informationen geben. Thema: Essen & Trinken. Bilden Sie zu jedem Stichwort eine Frage und beantworten Sie sie: Frühstück · Lieblingsessen · Sonntag · Bier · Fleisch · Brot.',
      difficulty: 'MEDIUM',
      tags: ['sprechen', 'teil-2', 'essen-trinken'],
    },
    {
      number: 3,
      type: 'SPEAKING',
      content:
        'Teil 2 — Um Informationen bitten und Informationen geben. Thema: Einkaufen. Bilden Sie zu jedem Stichwort eine Frage und beantworten Sie sie: Zeitung · Kasse · Obst · Schuhe · Buch · Stadtplan.',
      difficulty: 'MEDIUM',
      tags: ['sprechen', 'teil-2', 'einkaufen'],
    },
    {
      number: 4,
      type: 'SPEAKING',
      content:
        'Teil 3 — Bitten formulieren und darauf reagieren. Formulieren Sie zu jedem Bild eine Bitte und reagieren Sie darauf. Die Bildkarten zeigen: Autoschlüssel · Buch · Anzug/Jacke · Bleistift · Tisch und Stuhl · Uhr/Kette · Apfel · Messer und Gabel · Glas Wasser · Rauchverbot · Aktentasche · Radio.',
      difficulty: 'MEDIUM',
      tags: ['sprechen', 'teil-3', 'bitten'],
    },
  ],
}

// ============================================================================
// EXPORT
// ============================================================================

export const SEED_EXAMS: SeedExam[] = [
  {
    slug: 'vstep',
    name: 'VSTEP',
    fullName: 'Vietnamese Standardized Test of English Proficiency',
    language: 'EN',
    category: 'LANGUAGE_CERT',
    description:
      'Kỳ thi đánh giá năng lực tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam. VSTEP.3-5 đánh giá từ bậc 3 (B1) đến bậc 5 (C1), gồm 4 kỹ năng Nghe, Nói, Đọc, Viết.',
    sortOrder: 1,
    levels: [
      { slug: 'b1', name: 'Bậc 3 (B1)', cefr: 'B1', sortOrder: 1 },
      { slug: 'b2', name: 'Bậc 4 (B2)', cefr: 'B2', sortOrder: 2 },
      { slug: 'c1', name: 'Bậc 5 (C1)', cefr: 'C1', sortOrder: 3 },
    ],
    papers: [
      {
        slug: 'de-minh-hoa-3-5-so-1',
        title: 'VSTEP.3-5 — Đề minh hoạ số 1',
        levelSlug: 'b2',
        year: 2025,
        totalDuration: 35 * 60,
        status: 'PUBLISHED',
        provenanceKey: 'vstep-gov',
        sections: [vstepListening, vstepReading],
      },
    ],
  },
  {
    slug: 'topik',
    name: 'TOPIK',
    fullName: 'Test of Proficiency in Korean (한국어능력시험)',
    language: 'KO',
    category: 'LANGUAGE_CERT',
    description:
      'Kỳ thi năng lực tiếng Hàn do Viện Giáo dục Quốc tế Quốc gia Hàn Quốc (NIIED) tổ chức. TOPIK II đánh giá từ cấp 3 đến cấp 6 qua hai kỹ năng Nghe và Đọc, cùng phần Viết.',
    sortOrder: 2,
    levels: [
      { slug: 'topik-1', name: 'TOPIK I (Cấp 1–2)', sortOrder: 1 },
      { slug: 'topik-2', name: 'TOPIK II (Cấp 3–6)', sortOrder: 2 },
    ],
    papers: [
      {
        slug: 'topik-2-de-luyen-so-1',
        title: 'TOPIK II — Đề luyện số 1',
        levelSlug: 'topik-2',
        year: 2025,
        totalDuration: 30 * 60,
        status: 'PUBLISHED',
        provenanceKey: 'topik-kogl',
        sections: [topikListening, topikReading],
      },
    ],
  },
  {
    slug: 'goethe',
    name: 'Goethe-Zertifikat',
    fullName: 'Goethe-Zertifikat — Deutschprüfungen des Goethe-Instituts',
    language: 'DE',
    category: 'LANGUAGE_CERT',
    description:
      'Chứng chỉ tiếng Đức của Goethe-Institut, công nhận trên toàn thế giới và bám theo Khung tham chiếu châu Âu (CEFR). Mỗi đề gồm bốn phần Hören, Lesen, Schreiben và Sprechen. Đề trong kho là Modellsatz và Übungssatz chính thức do Goethe-Institut phát hành.',
    sortOrder: 4,
    levels: [
      { slug: 'a1', name: 'A1 — Start Deutsch 1', cefr: 'A1', sortOrder: 1 },
      { slug: 'a2', name: 'A2', cefr: 'A2', sortOrder: 2 },
      { slug: 'b1', name: 'B1', cefr: 'B1', sortOrder: 3 },
    ],
    papers: [
      {
        slug: 'a1-start-deutsch-1-modellsatz',
        title: 'Goethe-Zertifikat A1 — Start Deutsch 1, Modellsatz',
        levelSlug: 'a1',
        year: 2024,
        totalDuration: 80 * 60,
        status: 'PUBLISHED',
        provenanceKey: 'goethe-institut',
        sections: [sd1Hoeren, sd1Lesen, sd1Schreiben, sd1Sprechen],
      },
    ],
  },
  {
    slug: 'thpt-quoc-gia',
    name: 'THPT Quốc gia',
    fullName: 'Kỳ thi tốt nghiệp Trung học phổ thông Quốc gia',
    language: 'VI',
    category: 'NATIONAL_EXAM',
    description:
      'Kỳ thi tốt nghiệp THPT do Bộ Giáo dục và Đào tạo tổ chức, đồng thời là căn cứ xét tuyển đại học. Đề minh hoạ được Bộ công bố công khai hằng năm.',
    sortOrder: 3,
    levels: [
      { slug: 'tieng-anh', name: 'Môn Tiếng Anh', sortOrder: 1 },
      { slug: 'toan', name: 'Môn Toán', sortOrder: 2 },
    ],
    papers: [
      {
        slug: 'tieng-anh-minh-hoa-2025',
        title: 'THPT Quốc gia — Tiếng Anh, đề minh hoạ 2025',
        levelSlug: 'tieng-anh',
        year: 2025,
        totalDuration: 35 * 60,
        status: 'PUBLISHED',
        provenanceKey: 'thpt-gov',
        sections: [thptListening, thptReading],
      },
      // Đề gắn provenance RESTRICTED — SPEC mục 7 yêu cầu có để kiểm chứng
      // rằng nội dung này KHÔNG BAO GIỜ lộ ra public, kể cả khi status = PUBLISHED.
      {
        slug: 'tieng-anh-noi-bo-khong-duoc-publish',
        title: 'THPT Quốc gia — Tài liệu nội bộ (KHÔNG ĐƯỢC PUBLISH)',
        levelSlug: 'tieng-anh',
        year: 2024,
        totalDuration: 20 * 60,
        status: 'PUBLISHED', // cố ý PUBLISHED để chứng minh canPublish mới là chốt chặn
        provenanceKey: 'restricted-internal',
        sections: [
          {
            skill: 'READING',
            title: 'Nội bộ — không hiển thị',
            instructions: 'Nội dung tham khảo nội bộ.',
            duration: 10 * 60,
            questions: [
              {
                number: 1,
                type: 'SINGLE_CHOICE',
                content: 'Câu hỏi nội bộ — nếu bạn nhìn thấy dòng này ở giao diện public thì content filter đã hỏng.',
                choices: mc('A', 'B', 'C', 'D', 0),
                tags: ['internal'],
              },
            ],
          },
        ],
      },
    ],
  },
]

/** Bảng quy đổi điểm — SPEC F3: "lưu trong DB, không hardcode". */
export const SEED_SCORE_CONVERSIONS: {
  examSlug: string
  levelSlug?: string
  skill?: string
  minRaw: number
  maxRaw: number
  scaled: number
  label?: string
}[] = [
  // VSTEP: thang 0–10, quy đổi từ % đúng
  { examSlug: 'vstep', minRaw: 0, maxRaw: 19.99, scaled: 2.0, label: 'Chưa đạt' },
  { examSlug: 'vstep', minRaw: 20, maxRaw: 29.99, scaled: 3.0, label: 'Chưa đạt' },
  { examSlug: 'vstep', minRaw: 30, maxRaw: 39.99, scaled: 4.0, label: 'Bậc 3 (B1)' },
  { examSlug: 'vstep', minRaw: 40, maxRaw: 49.99, scaled: 5.0, label: 'Bậc 3 (B1)' },
  { examSlug: 'vstep', minRaw: 50, maxRaw: 59.99, scaled: 6.0, label: 'Bậc 4 (B2)' },
  { examSlug: 'vstep', minRaw: 60, maxRaw: 69.99, scaled: 6.5, label: 'Bậc 4 (B2)' },
  { examSlug: 'vstep', minRaw: 70, maxRaw: 79.99, scaled: 7.5, label: 'Bậc 4 (B2)' },
  { examSlug: 'vstep', minRaw: 80, maxRaw: 89.99, scaled: 8.5, label: 'Bậc 5 (C1)' },
  { examSlug: 'vstep', minRaw: 90, maxRaw: 100, scaled: 9.5, label: 'Bậc 5 (C1)' },

  // TOPIK II: thang 0–300 (Nghe 100 + Đọc 100 + Viết 100; v1 chấm Nghe/Đọc)
  { examSlug: 'topik', levelSlug: 'topik-2', minRaw: 0, maxRaw: 29.99, scaled: 60, label: '불합격' },
  { examSlug: 'topik', levelSlug: 'topik-2', minRaw: 30, maxRaw: 44.99, scaled: 120, label: '3급' },
  { examSlug: 'topik', levelSlug: 'topik-2', minRaw: 45, maxRaw: 59.99, scaled: 160, label: '4급' },
  { examSlug: 'topik', levelSlug: 'topik-2', minRaw: 60, maxRaw: 74.99, scaled: 200, label: '5급' },
  { examSlug: 'topik', levelSlug: 'topik-2', minRaw: 75, maxRaw: 89.99, scaled: 250, label: '6급' },
  { examSlug: 'topik', levelSlug: 'topik-2', minRaw: 90, maxRaw: 100, scaled: 290, label: '6급' },

  // THPT Quốc gia: thang 0–10
  { examSlug: 'thpt-quoc-gia', minRaw: 0, maxRaw: 100, scaled: 0, label: 'Theo tỉ lệ' },

  // Goethe-Zertifikat: thang 0–100 điểm, đạt từ 60 (theo quy định của Goethe-Institut).
  // Phần Schreiben Teil 2 và Sprechen không chấm tự động nên tỉ lệ % ở đây tính
  // trên các câu chấm được — xem UNGRADED_TYPES trong lib/enums.ts.
  { examSlug: 'goethe', minRaw: 0, maxRaw: 29.99, scaled: 20, label: 'nicht bestanden' },
  { examSlug: 'goethe', minRaw: 30, maxRaw: 44.99, scaled: 40, label: 'nicht bestanden' },
  { examSlug: 'goethe', minRaw: 45, maxRaw: 59.99, scaled: 55, label: 'nicht bestanden' },
  { examSlug: 'goethe', minRaw: 60, maxRaw: 69.99, scaled: 65, label: 'ausreichend' },
  { examSlug: 'goethe', minRaw: 70, maxRaw: 79.99, scaled: 75, label: 'befriedigend' },
  { examSlug: 'goethe', minRaw: 80, maxRaw: 89.99, scaled: 85, label: 'gut' },
  { examSlug: 'goethe', minRaw: 90, maxRaw: 100, scaled: 95, label: 'sehr gut' },
]
