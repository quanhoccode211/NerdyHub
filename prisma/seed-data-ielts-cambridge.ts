import type { SeedSection } from './seed-data'

/**
 * NỘI DUNG CÓ BẢN QUYỀN — CHỈ THAM KHẢO NỘI BỘ. KHÔNG PHÁT HÀNH.
 *
 * Bốn đề Reading chép từ sách luyện thi Cambridge IELTS. Khác hẳn `ieltsReading`
 * trong seed-data.ts: đề đó do đội ngũ tự viết theo ĐỊNH DẠNG IELTS nên phát
 * hành được; những đề trong file này là NỘI DUNG của Cambridge University Press
 * nên không.
 *
 * VÌ SAO NẰM RIÊNG MỘT FILE: mọi thứ có bản quyền của bên thứ ba gom vào đúng
 * một chỗ, để gỡ chúng ra là xoá một file chứ không phải đi dò từng đoạn trong
 * seed-data.ts. Thêm đề chép từ sách nào khác thì cũng thêm vào đây.
 *
 * Cả bốn đề đều gắn provenance `cambridge-restricted` (RESTRICTED,
 * canPublish = false) và `status: DRAFT`. Hai khoá độc lập của content-filter
 * (lib/content-filter.ts) đều đóng, nên đề:
 *
 *   - KHÔNG hiện trong Kho đề, sitemap hay dashboard — `publicPaperFilter` chặn
 *   - KHÔNG tạo được lượt làm bài — `assertPublishable` chặn ở POST /api/attempts
 *
 * Muốn mở ra công khai thì phải có văn bản cho phép của Cambridge University
 * Press trước, rồi đổi license sang LICENSED kèm licenseDocUrl. Bật mỗi
 * `canPublish` là bỏ qua đúng cái bước quan trọng.
 *
 * MỖI ĐỀ TỔNG ĐÚNG 40 ĐIỂM — bảng band trong SEED_SCORE_CONVERSIONS tính theo
 * phần trăm của 40, nên lệch một điểm là lệch cả band.
 *
 * SỐ CÂU CÓ CHỖ NHẢY, và đó là chủ ý. Dạng "Choose TWO letters" trong đề gốc
 * chiếm hai số (ví dụ Questions 20–21) nhưng chỉ là MỘT câu MULTI_CHOICE ở đây,
 * nên nó mang `number: 20`, `points: 2`, và câu kế tiếp là 22. Tổng điểm vẫn
 * đúng 40; chỉ dãy số là có lỗ.
 *
 * `IeltsStrategy` bật `partialCreditForMultiChoice` chính vì những câu đó: đề
 * thật cho 1 điểm mỗi lựa chọn đúng, chọn được một nửa vẫn có nửa điểm.
 */

export const ieltsCambridgeTest1: SeedSection = {
  skill: 'READING',
  title: 'Academic Reading — Test 1 (Passages 1–3)',
  instructions:
    'You should spend about 20 minutes on each passage. Answer all questions. Spelling must be correct; answers are marked exactly as written.',
  duration: 60 * 60,
  passages: [
    {
      title: 'The kākāpō',
      content: `<p><em>The kākāpō is a nocturnal, flightless parrot that is critically endangered and one of New Zealand's unique treasures.</em></p>
<p>The kākāpō, also known as the owl parrot, is a large, forest-dwelling bird, with a pale owl-like face. Up to 64 cm in length, it has predominantly yellow-green feathers, forward-facing eyes, a large grey beak, large blue feet, and relatively short wings and tail. It is the world's only flightless parrot, and is also possibly one of the world's longest-living birds, with a reported lifespan of up to 100 years.</p>
<p>Kākāpō are solitary birds and tend to occupy the same home range for many years. They forage on the ground and climb high into trees. They often leap from trees and flap their wings, but at best manage a controlled descent to the ground. They are entirely vegetarian, with their diet including the leaves, roots and bark of trees as well as bulbs, and fern fronds.</p>
<p>Kākāpō breed in summer and autumn, but only in years when food is plentiful. Males play no part in incubation or chick-rearing — females alone incubate eggs and feed the chicks. The 1–4 eggs are laid in soil, which is repeatedly turned over before and during incubation. The female kākāpō has to spend long periods away from the nest searching for food, which leaves the unattended eggs and chicks particularly vulnerable to predators.</p>
<p>Before humans arrived, kākāpō were common throughout New Zealand's forests. However, this all changed with the arrival of the first Polynesian settlers about 700 years ago. For the early settlers, the flightless kākāpō was easy prey. They ate its meat and used its feathers to make soft cloaks. With them came the Polynesian dog and rat, which also preyed on kākāpō. By the time European colonisers arrived in the early 1800s, kākāpō had become confined to the central North Island and forested parts of the South Island. The fall in kākāpō numbers was accelerated by European colonisation. A great deal of habitat was lost through forest clearance, and introduced species such as deer depleted the remaining forests of food. Other predators such as cats, stoats and two more species of rat were also introduced. The kākāpō were in serious trouble.</p>
<p>In 1894, the New Zealand government launched its first attempt to save the kākāpō. Conservationist Richard Henry led an effort to relocate several hundred of the birds to predator-free Resolution Island in Fiordland. Unfortunately, the island didn't remain predator free — stoats arrived within six years, eventually destroying the kākāpō population. By the mid-1900s, the kākāpō was practically a lost species. Only a few clung to life in the most isolated parts of New Zealand.</p>
<p>From 1949 to 1973, the newly formed New Zealand Wildlife Service made over 60 expeditions to find kākāpō, focusing mainly on Fiordland. Six were caught, but there were no females amongst them and all but one died within a few months of captivity. In 1974, a new initiative was launched, and by 1977, 18 more kākāpō were found in Fiordland. However, there were still no females. In 1977, a large population of males was spotted in Rakiura — a large island free from stoats, ferrets and weasels. There were about 200 individuals, and in 1980 it was confirmed females were also present. These birds have been the foundation of all subsequent work in managing the species.</p>
<p>Unfortunately, predation by feral cats on Rakiura Island led to a rapid decline in kākāpō numbers. As a result, during 1980–97, the surviving population was evacuated to three island sanctuaries: Codfish Island, Maud Island and Little Barrier Island. However, breeding success was hard to achieve. Rats were found to be a major predator of kākāpō chicks and an insufficient number of chicks survived to offset adult mortality. By 1995, although at least 12 chicks had been produced on the islands, only three had survived. The kākāpō population had dropped to 51 birds. The critical situation prompted an urgent review of kākāpō management in New Zealand.</p>
<p>In 1996, a new Recovery Plan was launched, together with a specialist advisory group called the Kākāpō Scientific and Technical Advisory Committee and a higher amount of funding. Renewed steps were taken to control predators on the three islands. Cats were eradicated from Little Barrier Island in 1980, and possums were eradicated from Codfish Island by 1986. However, the population did not start to increase until rats were removed from all three islands, and the birds were more intensively managed. This involved moving the birds between islands, supplementary feeding of adults and rescuing and hand-raising any failing chicks.</p>
<p>After the first five years of the Recovery Plan, the population was on target. By 2000, five new females had been produced, and the total population had grown to 62 birds. For the first time, there was cautious optimism for the future of kākāpō and by June 2020, a total of 210 birds was recorded.</p>
<p>Today, kākāpō management continues to be guided by the kākāpō Recovery Plan. Its key goals are: minimise the loss of genetic diversity in the kākāpō population, restore or maintain sufficient habitat to accommodate the expected increase in the kākāpō population, and ensure stakeholders continue to be fully engaged in the preservation of the species.</p>`,
      questions: [
        {
          number: 1,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "There are other parrots that share the kākāpō's inability to fly.",
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 1: "the world\'s only flightless parrot" — chỉ mình nó, nên khẳng định này SAI.',
        },
        {
          number: 2,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Adult kākāpō produce chicks every year.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 3: "only in years when food is plentiful" — không phải năm nào cũng đẻ.',
        },
        {
          number: 3,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Adult male kākāpō bring food back to nesting females.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 3: "Males play no part in incubation or chick-rearing"; con mái phải tự rời tổ đi kiếm ăn.',
        },
        {
          number: 4,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'The Polynesian rat was a greater threat to the kākāpō than Polynesian settlers.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['true-false-notgiven'],
          explanation: 'Bài kể cả người lẫn chuột đều săn kākāpō nhưng KHÔNG so sánh bên nào nguy hiểm hơn.',
        },
        {
          number: 5,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Kākāpō were transferred from Rakiura Island to other locations because they were at risk from feral cats.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: '"predation by feral cats on Rakiura Island led to a rapid decline… the surviving population was evacuated".',
        },
        {
          number: 6,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'One Recovery Plan initiative that helped increase the kākāpō population size was caring for struggling young birds.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: '"rescuing and hand-raising any failing chicks" nằm trong nhóm biện pháp quản lý chuyên sâu.',
        },
        {
          number: 7,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. A type of parrot — diet consists of fern fronds, various parts of a tree and ________.',
          correctText: ['bulbs'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 2: "as well as bulbs, and fern fronds".',
        },
        {
          number: 8,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Nests are created in ________ where eggs are laid.',
          correctText: ['soil'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 3: "The 1–4 eggs are laid in soil".',
        },
        {
          number: 9,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Arrival of Polynesian settlers — the ________ of the kākāpō were used to make clothes.',
          correctText: ['feathers'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 4: "used its feathers to make soft cloaks".',
        },
        {
          number: 10,
          type: 'FILL_BLANK',
          content: "Complete the note with ONE WORD AND/OR A NUMBER from the passage. Arrival of European colonisers — ________ were an animal which they introduced that ate the kākāpō's food sources.",
          correctText: ['deer'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Đoạn 4: "introduced species such as deer depleted the remaining forests of food".',
        },
        {
          number: 11,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. A definite sighting of female kākāpō on Rakiura Island was reported in the year ________.',
          correctText: ['1980'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Đoạn 6: "in 1980 it was confirmed females were also present".',
        },
        {
          number: 12,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. The Recovery Plan included an increase in ________.',
          correctText: ['funding'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Đoạn 8: "a higher amount of funding".',
        },
        {
          number: 13,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. A current goal of the Recovery Plan is to maintain the involvement of ________ in kākāpō protection.',
          correctText: ['stakeholders'],
          difficulty: 'HARD',
          tags: ['note-completion'],
          explanation: 'Đoạn cuối: "ensure stakeholders continue to be fully engaged".',
        },
      ],
    },
    {
      title: 'Reintroducing elms to Britain',
      content: `<p><em>Mark Rowe investigates attempts to reintroduce elms to Britain.</em></p>
<p><strong>A</strong>&nbsp; Around 25 million elms, accounting for 90% of all elm trees in the UK, died during the 1960s and '70s of Dutch elm disease. In the aftermath, the elm, once so dominant in the British landscape, was largely forgotten. However, there's now hope the elm may be reintroduced to the countryside of central and southern England. Any reintroduction will start from a very low base. 'The impact of the disease is difficult to picture if you hadn't seen what was there before,' says Matt Elliot of the Woodland Trust. 'You look at old photographs from the 1960s and it's only then that you realise the impact [elms had] … They were significant, large trees … then they were gone.'</p>
<p><strong>B</strong>&nbsp; The disease is caused by a fungus that blocks the elms' vascular (water, nutrient and food transport) system, causing branches to wilt and die. A first epidemic, which occurred in the 1920s, gradually died down, but in the '70s a second epidemic was triggered by shipments of elm from Canada. The wood came in the form of logs destined for boat building and its intact bark was perfect for the elm bark beetles that spread the deadly fungus. This time, the beetles carried a much more virulent strain that destroyed the vast majority of British elms.</p>
<p><strong>C</strong>&nbsp; Today, elms still exist in the southern English countryside but mostly only in low hedgerows between fields. 'We have millions of small elms in hedgerows but they get targeted by the beetle as soon as they reach a certain size,' says Karen Russell, co-author of the report 'Where we are with elm'. Once the trunk of the elm reaches 10–15 centimetres or so in diameter, it becomes a perfect size for beetles to lay eggs and for the fungus to take hold. Yet mature specimens have been identified, in counties such as Cambridgeshire, that are hundreds of years old, and have mysteriously escaped the epidemic.</p>
<p>The key, Russell says, is to identify and study those trees that have survived and work out why they stood tall when millions of others succumbed. Nevertheless, opportunities are limited as the number of these mature survivors is relatively small. 'What are the reasons for their survival?' asks Russell. 'Avoidance, tolerance, resistance? We don't know where the balance lies between the three. I don't see how it can be entirely down to luck.'</p>
<p><strong>D</strong>&nbsp; For centuries, elm ran a close second to oak as the hardwood tree of choice in Britain and was in many instances the most prominent tree in the landscape. Not only was elm common in European forests, it became a key component of birch, ash and hazel woodlands. The use of elm is thought to go back to the Bronze Age, when it was widely used for tools. Elm was also the preferred material for shields and early swords. In the 18th century, it was planted more widely and its wood was used for items such as storage crates and flooring. It was also suitable for items that experienced high levels of impact and was used to build the keel of the 19th-century sailing ship Cutty Sark as well as mining equipment.</p>
<p><strong>E</strong>&nbsp; Given how ingrained elm is in British culture, it's unsurprising the tree has many advocates. Amongst them is Peter Bourne of the National Elm Collection in Brighton. 'I saw Dutch elm disease unfold as a small boy,' he says. 'The elm seemed to be part of rural England, but I remember watching trees just lose their leaves and that really stayed with me.' Today, the city of Brighton's elms total about 17,000. Local factors appear to have contributed to their survival. Strong winds from the sea make it difficult for the determined elm bark beetle to attack this coastal city's elm population. However, the situation is precarious. 'The beetles can just march in if we're not careful, as the threat is right on our doorstep,' says Bourne.</p>
<p><strong>F</strong>&nbsp; Any prospect of the elm returning relies heavily on trees being either resistant to, or tolerant of, the disease. This means a widespread reintroduction would involve existing or new hybrid strains derived from resistant, generally non-native elm species. A new generation of seedlings have been bred and tested to see if they can withstand the fungus by cutting a small slit on the bark and injecting a tiny amount of the pathogen. 'The effects are very quick,' says Russell. 'You return in four to six weeks and trees that are resistant show no symptoms, whereas those that are susceptible show leaf loss and may even have died completely.'</p>
<p><strong>G</strong>&nbsp; All of this raises questions of social acceptance, acknowledges Russell. 'If we're putting elm back into the landscape, a small element of it is not native — are we bothered about that?' For her, the environmental case for reintroducing elm is strong. 'They will host wildlife, which is a good thing.' Others are more wary. 'On the face of it, it seems like a good idea,' says Elliot. The problem, he suggests, is that, 'You're replacing a native species with a horticultural analogue*. You're effectively cloning.' There's also the risk of introducing new diseases. Rather than plant new elms, the Woodland Trust emphasises providing space to those elms that have survived independently. 'Sometimes the best thing you can do is just give nature time to recover … over time, you might get resistance,' says Elliot.</p>
<p><small>* horticultural analogue: a cultivated plant species that is genetically similar to an existing species</small></p>`,
      questions: [
        {
          number: 14,
          type: 'SINGLE_CHOICE',
          content: 'Which section contains the following information? Reference to the research problems that arise from there being only a few surviving large elms. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Section A' },
            { label: 'B', content: 'Section B' },
            { label: 'C', content: 'Section C', isCorrect: true },
            { label: 'D', content: 'Section D' },
            { label: 'E', content: 'Section E' },
            { label: 'F', content: 'Section F' },
            { label: 'G', content: 'Section G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục C: "opportunities are limited as the number of these mature survivors is relatively small".',
        },
        {
          number: 15,
          type: 'SINGLE_CHOICE',
          content: 'Which section contains the following information? Details of a difference of opinion about the value of reintroducing elms to Britain. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Section A' },
            { label: 'B', content: 'Section B' },
            { label: 'C', content: 'Section C' },
            { label: 'D', content: 'Section D' },
            { label: 'E', content: 'Section E' },
            { label: 'F', content: 'Section F' },
            { label: 'G', content: 'Section G', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục G đặt Russell (ủng hộ) cạnh Elliot ("Others are more wary").',
        },
        {
          number: 16,
          type: 'SINGLE_CHOICE',
          content: 'Which section contains the following information? Reference to how Dutch elm disease was brought into Britain. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Section A' },
            { label: 'B', content: 'Section B', isCorrect: true },
            { label: 'C', content: 'Section C' },
            { label: 'D', content: 'Section D' },
            { label: 'E', content: 'Section E' },
            { label: 'F', content: 'Section F' },
            { label: 'G', content: 'Section G' },
          ],
          difficulty: 'EASY',
          tags: ['matching-information'],
          explanation: 'Mục B: "triggered by shipments of elm from Canada".',
        },
        {
          number: 17,
          type: 'SINGLE_CHOICE',
          content: 'Which section contains the following information? A description of the conditions that have enabled a location in Britain to escape Dutch elm disease. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Section A' },
            { label: 'B', content: 'Section B' },
            { label: 'C', content: 'Section C' },
            { label: 'D', content: 'Section D' },
            { label: 'E', content: 'Section E', isCorrect: true },
            { label: 'F', content: 'Section F' },
            { label: 'G', content: 'Section G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục E: gió biển mạnh ở Brighton khiến bọ khó tấn công.',
        },
        {
          number: 18,
          type: 'SINGLE_CHOICE',
          content: 'Which section contains the following information? Reference to the stage at which young elms become vulnerable to Dutch elm disease. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Section A' },
            { label: 'B', content: 'Section B' },
            { label: 'C', content: 'Section C', isCorrect: true },
            { label: 'D', content: 'Section D' },
            { label: 'E', content: 'Section E' },
            { label: 'F', content: 'Section F' },
            { label: 'G', content: 'Section G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục C: thân cây đạt đường kính 10–15 cm là kích thước lý tưởng cho bọ đẻ trứng.',
        },
        {
          number: 19,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. If a tree gets infected with Dutch elm disease, the damage rapidly becomes visible. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Matt Elliot' },
            { label: 'B', content: 'Karen Russell', isCorrect: true },
            { label: 'C', content: 'Peter Bourne' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Mục F, Russell: "The effects are very quick… four to six weeks".',
        },
        {
          number: 20,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. It may be better to wait and see if the mature elms that have survived continue to flourish. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Matt Elliot', isCorrect: true },
            { label: 'B', content: 'Karen Russell' },
            { label: 'C', content: 'Peter Bourne' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Mục G, Elliot: "just give nature time to recover".',
        },
        {
          number: 21,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. There must be an explanation for the survival of some mature elms. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Matt Elliot' },
            { label: 'B', content: 'Karen Russell', isCorrect: true },
            { label: 'C', content: 'Peter Bourne' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Mục C, Russell: "I don\'t see how it can be entirely down to luck."',
        },
        {
          number: 22,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. We need to be aware that insects carrying Dutch elm disease are not very far away. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Matt Elliot' },
            { label: 'B', content: 'Karen Russell' },
            { label: 'C', content: 'Peter Bourne', isCorrect: true },
          ],
          difficulty: 'EASY',
          tags: ['matching-people'],
          explanation: 'Mục E, Bourne: "the threat is right on our doorstep".',
        },
        {
          number: 23,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. You understand the effect Dutch elm disease has had when you see evidence of how prominent the tree once was. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Matt Elliot', isCorrect: true },
            { label: 'B', content: 'Karen Russell' },
            { label: 'C', content: 'Peter Bourne' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Mục A, Elliot: nhìn ảnh cũ thập niên 1960 mới thấy được mức độ tác động.',
        },
        {
          number: 24,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. Uses of a popular tree — For hundreds of years, the only tree that was more popular in Britain than elm was ________.',
          correctText: ['oak'],
          difficulty: 'EASY',
          tags: ['summary-completion'],
          explanation: 'Mục D: "elm ran a close second to oak".',
        },
        {
          number: 25,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. In the 18th century, elm was grown to provide wood for boxes and ________.',
          correctText: ['flooring'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục D: "storage crates and flooring".',
        },
        {
          number: 26,
          type: 'FILL_BLANK',
          content: "Complete the summary with ONE WORD ONLY from the passage. Due to its strength, elm was often used for mining equipment and the Cutty Sark's ________ was also constructed from elm.",
          correctText: ['keel'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục D: "used to build the keel of the 19th-century sailing ship Cutty Sark".',
        },
      ],
    },
    {
      title: 'How stress affects our judgement',
      content: `<p>Some of the most important decisions of our lives occur while we're feeling stressed and anxious. From medical decisions to financial and professional ones, we are all sometimes required to weigh up information under stressful conditions. But do we become better or worse at processing and using information under such circumstances?</p>
<p>My colleague and I, both neuroscientists, wanted to investigate how the mind operates under stress, so we visited some local fire stations. Firefighters' workdays vary quite a bit. Some are pretty relaxed; they'll spend their time washing the truck, cleaning equipment, cooking meals and reading. Other days can be hectic, with numerous life-threatening incidents to attend to; they'll enter burning homes to rescue trapped residents, and assist with medical emergencies. These ups and downs presented the perfect setting for an experiment on how people's ability to use information changes when they feel under pressure.</p>
<p>We found that perceived threat acted as a trigger for a stress reaction that made the task of processing information easier for the firefighters — but only as long as it conveyed bad news.</p>
<p>This is how we arrived at these results. We asked the firefighters to estimate their likelihood of experiencing 40 different adverse events in their life, such as being involved in an accident or becoming a victim of card fraud. We then gave them either good news (that their likelihood of experiencing these events was lower than they'd thought) or bad news (that it was higher) and asked them to provide new estimates.</p>
<p>People are normally quite optimistic — they will ignore bad news and embrace the good. This is what happened when the firefighters were relaxed; but when they were under stress, a different pattern emerged. Under these conditions, they became hyper-vigilant to bad news, even when it had nothing to do with their job (such as learning that the likelihood of card fraud was higher than they'd thought), and altered their beliefs in response. In contrast, stress didn't change how they responded to good news (such as learning that the likelihood of card fraud was lower than they'd thought).</p>
<p>Back in our lab, we observed the same pattern in students who were told they had to give a surprise public speech, which would be judged by a panel, recorded and posted online. Sure enough, their cortisol levels spiked, their heart rates went up and they suddenly became better at processing unrelated, yet alarming, information about rates of disease and violence.</p>
<p>When we experience stressful events, a physiological change is triggered that causes us to take in warnings and focus on what might go wrong. Brain imaging reveals that this 'switch' is related to a sudden boost in a neural signal important for learning, specifically in response to unexpected warning signs, such as faces expressing fear.</p>
<p>Such neural engineering could have helped prehistoric humans to survive. When our ancestors found themselves surrounded by hungry animals, they would have benefited from an increased ability to learn about hazards. In a safe environment, however, it would have been wasteful to be on high alert constantly. So, a neural switch that automatically increases or decreases our ability to process warnings in response to changes in our environment could have been useful. In fact, people with clinical depression and anxiety seem unable to switch away from a state in which they absorb all the negative messages around them.</p>
<p>It is also important to realise that stress travels rapidly from one person to the next. If a co-worker is stressed, we are more likely to tense up and feel stressed ourselves. We don't even need to be in the same room with someone for their emotions to influence our behaviour. Studies show that if we observe positive feeds on social media, such as images of a pink sunset, we are more likely to post uplifting messages ourselves. If we observe negative posts, such as complaints about a long queue at the coffee shop, we will in turn create more negative posts.</p>
<p>In some ways, many of us now live as if we are in danger, constantly ready to tackle demanding emails and text messages, and respond to news alerts and comments on social media. Repeatedly checking your phone, according to a survey conducted by the American Psychological Association, is related to stress. In other words, a pre-programmed physiological reaction, which evolution has equipped us with to help us avoid famished predators, is now being triggered by an online post. Social media posting, according to one study, raises your pulse, makes you sweat, and enlarges your pupils more than most daily activities.</p>
<p>The fact that stress increases the likelihood that we will focus more on alarming messages, together with the fact that it spreads extremely rapidly, can create collective fear that is not always justified. After a stressful public event, such as a natural disaster or major financial crash, there is often a wave of alarming information in traditional and social media, which individuals become very aware of. But that has the effect of exaggerating existing danger. And so, a reliable pattern emerges — stress is triggered, spreading from one person to the next, which temporarily enhances the likelihood that people will take in negative reports, which increases stress further. As a result, trips are cancelled, even if the disaster took place across the globe; stocks are sold, even when holding on is the best thing to do.</p>
<p>The good news, however, is that positive emotions, such as hope, are contagious too, and are powerful in inducing people to act to find solutions. Being aware of the close relationship between people's emotional state and how they process information can help us frame our messages more effectively and become conscientious agents of change.</p>`,
      questions: [
        {
          number: 27,
          type: 'SINGLE_CHOICE',
          content: 'In the first paragraph, the writer introduces the topic of the text by',
          choices: [
            { label: 'A', content: 'defining some commonly used terms.' },
            { label: 'B', content: 'questioning a widely held assumption.' },
            { label: 'C', content: 'mentioning a challenge faced by everyone.', isCorrect: true },
            { label: 'D', content: 'specifying a situation which makes us most anxious.' },
          ],
          difficulty: 'MEDIUM',
          tags: ['multiple-choice'],
          explanation: '"we are all sometimes required to weigh up information under stressful conditions" — chuyện ai cũng gặp.',
        },
        {
          number: 28,
          type: 'SINGLE_CHOICE',
          content: 'What point does the writer make about firefighters in the second paragraph?',
          choices: [
            { label: 'A', content: 'The regular changes of stress levels in their working lives make them ideal study subjects.', isCorrect: true },
            { label: 'B', content: 'The strategies they use to handle stress are of particular interest to researchers.' },
            { label: 'C', content: 'The stressful nature of their job is typical of many public service professions.' },
            { label: 'D', content: 'Their personalities make them especially well-suited to working under stress.' },
          ],
          difficulty: 'MEDIUM',
          tags: ['multiple-choice'],
          explanation: '"These ups and downs presented the perfect setting for an experiment".',
        },
        {
          number: 29,
          type: 'SINGLE_CHOICE',
          content: 'What is the writer doing in the fourth paragraph?',
          choices: [
            { label: 'A', content: 'explaining their findings' },
            { label: 'B', content: 'justifying their approach' },
            { label: 'C', content: 'setting out their objectives' },
            { label: 'D', content: 'describing their methodology', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['multiple-choice'],
          explanation: '"This is how we arrived at these results" — kể lại cách làm thí nghiệm.',
        },
        {
          number: 30,
          type: 'SINGLE_CHOICE',
          content: 'In the seventh paragraph, the writer describes a mechanism in the brain which',
          choices: [
            { label: 'A', content: 'enables people to respond more quickly to stressful situations.' },
            { label: 'B', content: 'results in increased ability to control our levels of anxiety.' },
            { label: 'C', content: 'produces heightened sensitivity to indications of external threats.', isCorrect: true },
            { label: 'D', content: 'is activated when there is a need to communicate a sense of danger.' },
          ],
          difficulty: 'HARD',
          tags: ['multiple-choice'],
          explanation: '"causes us to take in warnings… in response to unexpected warning signs".',
        },
        {
          number: 31,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. At times when they were relaxed, the firefighters usually…',
          choices: [
            { label: 'A', content: 'made them feel optimistic.' },
            { label: 'B', content: 'took relatively little notice of bad news.', isCorrect: true },
            { label: 'C', content: 'responded to negative and positive information in the same way.' },
            { label: 'D', content: 'were feeling under stress.' },
            { label: 'E', content: 'put them in a stressful situation.' },
            { label: 'F', content: 'behaved in a similar manner, regardless of the circumstances.' },
            { label: 'G', content: 'thought it more likely that they would experience something bad.' },
          ],
          difficulty: 'MEDIUM',
          tags: ['sentence-endings'],
          explanation: '"People are normally quite optimistic — they will ignore bad news… This is what happened when the firefighters were relaxed".',
        },
        {
          number: 32,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. The researchers noted that when the firefighters were stressed, they…',
          choices: [
            { label: 'A', content: 'made them feel optimistic.' },
            { label: 'B', content: 'took relatively little notice of bad news.' },
            { label: 'C', content: 'responded to negative and positive information in the same way.' },
            { label: 'D', content: 'were feeling under stress.' },
            { label: 'E', content: 'put them in a stressful situation.' },
            { label: 'F', content: 'behaved in a similar manner, regardless of the circumstances.' },
            { label: 'G', content: 'thought it more likely that they would experience something bad.', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['sentence-endings'],
          explanation: 'Khi căng thẳng họ "became hyper-vigilant to bad news… and altered their beliefs in response".',
        },
        {
          number: 33,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. When the firefighters were told good news, they always…',
          choices: [
            { label: 'A', content: 'made them feel optimistic.' },
            { label: 'B', content: 'took relatively little notice of bad news.' },
            { label: 'C', content: 'responded to negative and positive information in the same way.' },
            { label: 'D', content: 'were feeling under stress.' },
            { label: 'E', content: 'put them in a stressful situation.' },
            { label: 'F', content: 'behaved in a similar manner, regardless of the circumstances.', isCorrect: true },
            { label: 'G', content: 'thought it more likely that they would experience something bad.' },
          ],
          difficulty: 'HARD',
          tags: ['sentence-endings'],
          explanation: '"stress didn\'t change how they responded to good news" — phản ứng như nhau ở mọi hoàn cảnh.',
        },
        {
          number: 34,
          type: 'SINGLE_CHOICE',
          content: "Complete the sentence with the correct ending. The students' cortisol levels and heart rates were affected when the researchers…",
          choices: [
            { label: 'A', content: 'made them feel optimistic.' },
            { label: 'B', content: 'took relatively little notice of bad news.' },
            { label: 'C', content: 'responded to negative and positive information in the same way.' },
            { label: 'D', content: 'were feeling under stress.' },
            { label: 'E', content: 'put them in a stressful situation.', isCorrect: true },
            { label: 'F', content: 'behaved in a similar manner, regardless of the circumstances.' },
            { label: 'G', content: 'thought it more likely that they would experience something bad.' },
          ],
          difficulty: 'MEDIUM',
          tags: ['sentence-endings'],
          explanation: 'Sinh viên được báo phải phát biểu trước đám đông — tình huống gây căng thẳng.',
        },
        {
          number: 35,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. In both experiments, negative information was processed better when the subjects…',
          choices: [
            { label: 'A', content: 'made them feel optimistic.' },
            { label: 'B', content: 'took relatively little notice of bad news.' },
            { label: 'C', content: 'responded to negative and positive information in the same way.' },
            { label: 'D', content: 'were feeling under stress.', isCorrect: true },
            { label: 'E', content: 'put them in a stressful situation.' },
            { label: 'F', content: 'behaved in a similar manner, regardless of the circumstances.' },
            { label: 'G', content: 'thought it more likely that they would experience something bad.' },
          ],
          difficulty: 'MEDIUM',
          tags: ['sentence-endings'],
          explanation: 'Kết luận chung của cả hai thí nghiệm: căng thẳng làm tiếp nhận tin xấu tốt hơn.',
        },
        {
          number: 36,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? The tone of the content we post on social media tends to reflect the nature of the posts in our feeds.',
          choices: [
            { label: 'A', content: 'YES', isCorrect: true },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['yes-no-notgiven'],
          explanation: 'Feed tích cực → đăng bài tích cực; feed tiêu cực → đăng bài tiêu cực.',
        },
        {
          number: 37,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? Phones have a greater impact on our stress levels than other electronic media devices.',
          choices: [
            { label: 'A', content: 'YES' },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['yes-no-notgiven'],
          explanation: 'Bài nói xem điện thoại liên tục gắn với căng thẳng, nhưng KHÔNG so sánh với thiết bị khác.',
        },
        {
          number: 38,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? The more we read about a stressful public event on social media, the less able we are to take the information in.',
          choices: [
            { label: 'A', content: 'YES' },
            { label: 'B', content: 'NO', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'HARD',
          tags: ['yes-no-notgiven'],
          explanation: 'Ngược lại: căng thẳng "enhances the likelihood that people will take in negative reports".',
        },
        {
          number: 39,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? Stress created by social media posts can lead us to take unnecessary precautions.',
          choices: [
            { label: 'A', content: 'YES', isCorrect: true },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['yes-no-notgiven'],
          explanation: '"trips are cancelled, even if the disaster took place across the globe".',
        },
        {
          number: 40,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "Do the following statements agree with the claims of the writer? Our tendency to be affected by other people's moods can be used in a positive way.",
          choices: [
            { label: 'A', content: 'YES', isCorrect: true },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['yes-no-notgiven'],
          explanation: 'Đoạn cuối: hy vọng cũng lây lan, giúp "become conscientious agents of change".',
        },
      ],
    },
  ],
}

export const ieltsCambridgeTest2: SeedSection = {
  skill: 'READING',
  title: 'Academic Reading — Test 2 (Passages 1–3)',
  instructions:
    'You should spend about 20 minutes on each passage. Answer all questions. Spelling must be correct; answers are marked exactly as written.',
  duration: 60 * 60,
  passages: [
    {
      title: 'Manatees',
      content: `<p>Manatees, also known as sea cows, are aquatic mammals that belong to a group of animals called Sirenia. This group also contains dugongs. Dugongs and manatees look quite alike — they are similar in size, colour and shape, and both have flexible flippers for forelimbs. However, the manatee has a broad, rounded tail, whereas the dugong's is fluked, like that of a whale. There are three species of manatees: the West Indian manatee (<em>Trichechus manatus</em>), the African manatee (<em>Trichechus senegalensis</em>) and the Amazonian manatee (<em>Trichechus inunguis</em>).</p>
<p>Unlike most mammals, manatees have only six bones in their neck — most others, including humans and giraffes, have seven. This short neck allows a manatee to move its head up and down, but not side to side. To see something on its left or its right, a manatee must turn its entire body, steering with its flippers. Manatees have pectoral flippers but no back limbs, only a tail for propulsion. They do have pelvic bones, however — a leftover from their evolution from a four-legged to a fully aquatic animal. Manatees share some visual similarities to elephants. Like elephants, manatees have thick, wrinkled skin. They also have some hairs covering their bodies which help them sense vibrations in the water around them.</p>
<p>Seagrasses and other marine plants make up most of a manatee's diet. Manatees spend about eight hours each day grazing and uprooting plants. They eat up to 15% of their weight in food each day. African manatees are omnivorous — studies have shown that molluscs and fish make up a small part of their diets. West Indian and Amazonian manatees are both herbivores.</p>
<p>Manatees' teeth are all molars — flat, rounded teeth for grinding food. Due to manatees' abrasive aquatic plant diet, these teeth get worn down and they eventually fall out, so they continually grow new teeth that get pushed forward to replace the ones they lose. Instead of having incisors to grasp their food, manatees have lips which function like a pair of hands to help tear food away from the seafloor.</p>
<p>Manatees are fully aquatic, but as mammals, they need to come up to the surface to breathe. When awake, they typically surface every two to four minutes, but they can hold their breath for much longer. Adult manatees sleep underwater for 10–12 hours a day, but they come up for air every 15–20 minutes. Active manatees need to breathe more frequently. It's thought that manatees use their muscular diaphragm and breathing to adjust their buoyancy. They may use diaphragm contractions to compress and store gas in folds in their large intestine to help them float.</p>
<p>The West Indian manatee reaches about 3.5 metres long and weighs on average around 500 kilogrammes. It moves between fresh water and salt water, taking advantage of coastal mangroves and coral reefs, rivers, lakes and inland lagoons. There are two subspecies of West Indian manatee: the Antillean manatee is found in waters from the Bahamas to Brazil, whereas the Florida manatee is found in US waters, although some individuals have been recorded in the Bahamas. In winter, the Florida manatee is typically restricted to Florida. When the ambient water temperature drops below 20°C, it takes refuge in naturally and artificially warmed water, such as at the warm-water outfalls from powerplants.</p>
<p>The African manatee is also about 3.5 metres long and found in the sea along the west coast of Africa, from Mauritania down to Angola. The species also makes use of rivers, with the mammals seen in landlocked countries such as Mali and Niger.</p>
<p>The Amazonian manatee is the smallest species, though it is still a big animal. It grows to about 2.5 metres long and 350 kilogrammes. Amazonian manatees favour calm, shallow waters that are above 23°C. This species is found in fresh water in the Amazon Basin in Brazil, as well as in Colombia, Ecuador and Peru.</p>
<p>All three manatee species are endangered or at a heightened risk of extinction. The African manatee and Amazonian manatee are both listed as Vulnerable by the International Union for Conservation of Nature (IUCN). It is estimated that 140,000 Amazonian manatees were killed between 1935 and 1954 for their meat, fat and skin, with the latter used to make leather. In more recent years, African manatee decline has been tied to incidental capture in fishing nets and hunting. Manatee hunting is now illegal in every country the African species is found in.</p>
<p>The two subspecies of West Indian manatee are listed as Endangered by the IUCN. Both are also expected to undergo a decline of 20% over the next 40 years. A review of almost 1,800 cases of entanglement in fishing nets and of plastic consumption among marine mammals in US waters from 2009 to 2020 found that at least 700 cases involved manatees. The chief cause of death in Florida manatees is boat strikes. However, laws in certain parts of Florida now limit boat speeds during winter, allowing slow-moving manatees more time to respond.</p>`,
      questions: [
        {
          number: 1,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Appearance — manatees look similar to dugongs, but with a differently shaped ________.',
          correctText: ['tail'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 1: manatee đuôi tròn bè, dugong đuôi chẻ như đuôi cá voi.',
        },
        {
          number: 2,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Movement — manatees need to use their ________ to help turn their bodies around in order to look sideways.',
          correctText: ['flippers'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 2: "must turn its entire body, steering with its flippers".',
        },
        {
          number: 3,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Movement — manatees sense vibrations in the water by means of ________ on their skin.',
          correctText: ['hair', 'hairs'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Đoạn 2: "some hairs covering their bodies which help them sense vibrations".',
        },
        {
          number: 4,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Feeding — manatees eat mainly aquatic vegetation, such as ________.',
          correctText: ['seagrasses', 'seagrass'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 3: "Seagrasses and other marine plants make up most of a manatee\'s diet".',
        },
        {
          number: 5,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Feeding — manatees grasp and pull up plants with their ________.',
          correctText: ['lips'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Đoạn 4: "manatees have lips which function like a pair of hands".',
        },
        {
          number: 6,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD AND/OR A NUMBER from the passage. Breathing — manatees may regulate the ________ of their bodies by using muscles of the diaphragm to store air internally.',
          correctText: ['buoyancy'],
          difficulty: 'HARD',
          tags: ['note-completion'],
          explanation: 'Đoạn 5: "use their muscular diaphragm and breathing to adjust their buoyancy".',
        },
        {
          number: 7,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'West Indian manatees can be found in a variety of different aquatic habitats.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 6: rừng ngập mặn, rạn san hô, sông, hồ, đầm phá — cả nước ngọt lẫn nước mặn.',
        },
        {
          number: 8,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'The Florida manatee lives in warmer waters than the Antillean manatee.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['true-false-notgiven'],
          explanation: 'Bài mô tả vùng phân bố của cả hai nhưng KHÔNG so sánh nhiệt độ nước.',
        },
        {
          number: 9,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "The African manatee's range is limited to coastal waters between the West African countries of Mauritania and Angola.",
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 7: chúng còn vào sông, xuất hiện ở cả Mali và Niger — hai nước không giáp biển.',
        },
        {
          number: 10,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'The extent of the loss of Amazonian manatees in the mid-twentieth century was only revealed many years later.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['true-false-notgiven'],
          explanation: 'Có con số ước tính 1935–1954 nhưng KHÔNG nói con số đó được công bố khi nào.',
        },
        {
          number: 11,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'It is predicted that West Indian manatee populations will fall in the coming decades.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn cuối: "expected to undergo a decline of 20% over the next 40 years".',
        },
        {
          number: 12,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'The risk to manatees from entanglement and plastic consumption increased significantly in the period 2009-2020.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['true-false-notgiven'],
          explanation: 'Bài cho tổng số ca trong giai đoạn đó, không nói xu hướng tăng hay giảm.',
        },
        {
          number: 13,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'There is some legislation in place which aims to reduce the likelihood of boat strikes on manatees in Florida.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn cuối: luật giới hạn tốc độ tàu thuyền vào mùa đông ở một số nơi tại Florida.',
        },
      ],
    },
    {
      title: 'Procrastination',
      content: `<p><em>A psychologist explains why we put off important tasks and how we can break this habit.</em></p>
<p><strong>A</strong>&nbsp; Procrastination is the habit of delaying a necessary task, usually by focusing on less urgent, more enjoyable, and easier activities instead. We all do it from time to time. We might be composing a message to a friend who we have to let down, or putting together an important report for college or work; we're doing our best to avoid doing the job at hand, but deep down we know that we should just be getting on with it. Unfortunately, berating ourselves won't stop us procrastinating again. In fact, it's one of the worst things we can do. This matters because, as my research shows, procrastination doesn't just waste time, but is actually linked to other problems, too.</p>
<p><strong>B</strong>&nbsp; Contrary to popular belief, procrastination is not due to laziness or poor time management. Scientific studies suggest procrastination is, in fact, caused by poor mood management. This makes sense if we consider that people are more likely to put off starting or completing tasks that they are really not keen to do. If just thinking about the task threatens our sense of self-worth or makes us anxious, we will be more likely to put it off. Research involving brain imaging has found that areas of the brain linked to detection of threats and emotion regulation are actually different in people who chronically procrastinate compared to those who don't procrastinate frequently.</p>
<p><strong>C</strong>&nbsp; Tasks that are emotionally loaded or difficult, such as preparing for exams, are prime candidates for procrastination. People with low self-esteem are more likely to procrastinate. Another group of people who tend to procrastinate are perfectionists, who worry their work will be judged harshly by others. We know that if we don't finish that report or complete those home repairs, then what we did can't be evaluated. When we avoid such tasks, we also avoid the negative emotions associated with them. This is rewarding, and it conditions us to use procrastination to repair our mood. If we engage in more enjoyable tasks instead, we get another mood boost. In the long run, however, procrastination isn't an effective way of managing emotions. The 'mood repair' we experience is temporary. Afterwards, people tend to be left with a sense of guilt that not only increases their negative mood, but also reinforces their tendency to procrastinate.</p>
<p><strong>D</strong>&nbsp; So why is this such a problem? When most people think of the costs of procrastination, they think of the toll on productivity. For example, studies have shown that procrastination negatively impacts on student performance. But putting off reading textbooks and writing essays may affect other areas of students' lives. In one study of over 3,000 German students over a six-month period, those who reported procrastinating over their university work were also more likely to engage in study-related misconduct, such as cheating and plagiarism. But the behaviour that procrastination was most closely linked with was using fraudulent excuses to get deadline extensions. Other research shows that employees on average spend almost a quarter of their workday procrastinating, and again this is linked with negative outcomes. In fact, in one US survey of over 22,000 employees, participants who said they regularly procrastinated had less annual income and less employment stability. For every one-point increase on a measure of chronic procrastination, annual income decreased by US$15,000.</p>
<p><strong>E</strong>&nbsp; Procrastination also correlates with serious health and well-being problems. A tendency to procrastinate is linked to poor mental health, including higher levels of depression and anxiety. Across numerous studies, I've found people who regularly procrastinate report a greater number of health issues, such as headaches, flu and colds, and digestive issues. They also experience higher levels of stress and poor sleep quality. They are less likely to practise healthy behaviours, such as eating a healthy diet and regularly exercising, and use destructive coping strategies to manage their stress. In one study of over 700 people, I found people prone to procrastination had a 63% greater risk of poor heart health after accounting for other personality traits and demographics.</p>
<p><strong>F</strong>&nbsp; Finding better ways of managing our emotions is one route out of the vicious cycle of procrastination. An important first step is to manage our environment and how we view the task. There are a number of evidence-based strategies that can help us fend off distractions that can occupy our minds when we should be focusing on the thing we should be getting on with. For example, reminding ourselves about why the task is important and valuable can increase positive feelings towards it.</p>
<p>Forgiving ourselves and feeling compassion when we procrastinate can help break the procrastination cycle. We should admit that we feel bad, but not be overly critical of ourselves. We should remind ourselves that we're not the first person to procrastinate, nor the last. Doing this can take the edge off the negative feelings we have about ourselves when we procrastinate. This can all make it easier to get back on track.</p>`,
      questions: [
        {
          number: 14,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? Mention of false assumptions about why people procrastinate. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B', isCorrect: true },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục B mở đầu bằng "Contrary to popular belief… not due to laziness or poor time management".',
        },
        {
          number: 15,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? Reference to the realisation that others also procrastinate. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục F: "we\'re not the first person to procrastinate, nor the last".',
        },
        {
          number: 16,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? Neurological evidence of a link between procrastination and emotion. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B', isCorrect: true },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục B: nghiên cứu chụp ảnh não thấy vùng phát hiện mối đe doạ và điều tiết cảm xúc khác biệt.',
        },
        {
          number: 17,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. What makes us procrastinate? Many people think that procrastination is the result of ________.',
          correctText: ['laziness'],
          difficulty: 'EASY',
          tags: ['summary-completion'],
          explanation: 'Mục B: "not due to laziness or poor time management".',
        },
        {
          number: 18,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. The tasks we are most likely to put off are those that could damage our self-esteem or cause us to feel ________ when we think about them.',
          correctText: ['anxious'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục B: "threatens our sense of self-worth or makes us anxious".',
        },
        {
          number: 19,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. Research comparing chronic procrastinators with other people even found differences in the brain regions associated with regulating emotions and identifying ________.',
          correctText: ['threats', 'threat'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục B: "areas of the brain linked to detection of threats and emotion regulation".',
        },
        {
          number: 20,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. Getting ready to take ________ might be a typical example of an emotionally loaded, difficult task.',
          correctText: ['exams', 'exam'],
          difficulty: 'EASY',
          tags: ['summary-completion'],
          explanation: 'Mục C: "such as preparing for exams".',
        },
        {
          number: 21,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. People who are likely to procrastinate tend to be either ________ or those with low self-esteem.',
          correctText: ['perfectionists', 'perfectionist'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục C: "Another group of people who tend to procrastinate are perfectionists".',
        },
        {
          number: 22,
          type: 'FILL_BLANK',
          content: "Complete the summary with ONE WORD ONLY from the passage. Procrastination is only a short-term measure for managing emotions. It's often followed by a feeling of ________, which worsens our mood and leads to more procrastination.",
          correctText: ['guilt'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục C: "left with a sense of guilt that not only increases their negative mood".',
        },
        {
          number: 23,
          type: 'MULTI_CHOICE',
          content: 'Questions 23–24. Choose TWO letters, A–E. Which TWO comparisons between employees who often procrastinate and those who do not are mentioned in the text?',
          choices: [
            { label: 'A', content: 'Their salaries are lower.', isCorrect: true },
            { label: 'B', content: 'The quality of their work is inferior.' },
            { label: 'C', content: "They don't keep their jobs for as long.", isCorrect: true },
            { label: 'D', content: "They don't enjoy their working lives as much." },
            { label: 'E', content: 'They have poorer relationships with colleagues.' },
          ],
          points: 2,
          difficulty: 'MEDIUM',
          tags: ['multiple-answer'],
          explanation: 'Mục D: "less annual income and less employment stability" — thu nhập thấp hơn và việc làm kém ổn định.',
        },
        {
          number: 25,
          type: 'MULTI_CHOICE',
          content: 'Questions 25–26. Choose TWO letters, A–E. Which TWO recommendations for getting out of a cycle of procrastination does the writer give?',
          choices: [
            { label: 'A', content: 'not judging ourselves harshly', isCorrect: true },
            { label: 'B', content: 'setting ourselves manageable aims' },
            { label: 'C', content: 'rewarding ourselves for tasks achieved' },
            { label: 'D', content: 'prioritising tasks according to their importance' },
            { label: 'E', content: 'avoiding things that stop us concentrating on our tasks', isCorrect: true },
          ],
          points: 2,
          difficulty: 'MEDIUM',
          tags: ['multiple-answer'],
          explanation: 'Mục F: "fend off distractions" và "not be overly critical of ourselves".',
        },
      ],
    },
    {
      title: 'Invasion of the Robot Umpires',
      content: `<p>A few years ago, Fred DeJesus from Brooklyn, New York became the first umpire in a minor league baseball game to use something called the Automated Ball-Strike System (ABS), often referred to as the 'robo-umpire'. Instead of making any judgments himself about a strike*, DeJesus had decisions fed to him through an earpiece, connected to a modified missile-tracking system. The contraption looked like a large black pizza box with one glowing green eye; it was mounted above the press stand.</p>
<p>Major League Baseball (MLB), who had commissioned the system, wanted human umpires to announce the calls, just as they would have done in the past. When the first pitch came in, a recorded voice told DeJesus it was a strike. Previously, calling a strike was a judgment call on the part of the umpire. Even if the batter does not hit the ball, a pitch that passes through the 'strike zone' (an imaginary zone about seventeen inches wide, stretching from the batter's knees to the middle of his chest) is considered a strike. During that first game, when DeJesus announced calls, there was no heckling and no shouted disagreement. Nobody said a word.</p>
<p>For a hundred and fifty years or so, the strike zone has been the game's animating force — countless arguments between a team's manager and the umpire have taken place over its boundaries and whether a ball had crossed through it. The rules of play have evolved in various stages. Today, everyone knows that you may scream your disagreement in an umpire's face, but you must never shout personal abuse at them or touch them. That's a no-no. When the robo-umpires came, however, the arguments stopped.</p>
<p>During the first robo-umpire season, players complained about some strange calls. In response, MLB decided to tweak the dimensions of the zone, and the following year the consensus was that ABS is profoundly consistent. MLB says the device is near-perfect, precise to within fractions of an inch. 'It'll reduce controversy in the game, and be good for the game,' says Rob Manfred, who is Commissioner for MLB. But the question is whether controversy is worth reducing, or whether it is the sign of a human hand.</p>
<p>A human, at least, yells back. When I spoke with Frank Viola, a coach for a North Carolina team, he said that ABS works as designed, but that it was also unforgiving and pedantic, almost legalistic. 'Manfred is a lawyer,' Viola noted. Some pitchers have complained that, compared with a human's, the robot's strike zone seems too precise. Viola was once a major-league player himself. When he was pitching, he explained, umpires rewarded skill. 'Throw it where you aimed, and it would be a strike, even if it was an inch or two outside. There was a dialogue between pitcher and umpire.'</p>
<p>The executive tasked with running the experiment for MLB is Morgan Sword, who's in charge of baseball operations. According to Sword, ABS was part of a larger project to make baseball more exciting since executives are terrified of losing younger fans, as has been the case with horse racing and boxing. He explains how they began the process by asking fans what version of baseball they found most exciting. The results showed that everyone wanted more action: more hits, more defense, more baserunning. This type of baseball essentially hasn't existed since the 1960s, when the hundred-mile-an-hour fastball, which is difficult to hit and control, entered the game. It flattened the game into strikeouts, walks, and home runs — a type of play lacking much action.</p>
<p>Sword's team brainstormed potential fixes. Any rule that existed, they talked about changing — from changing the bats to changing the geometry of the field. But while all of these were ruled out as potential fixes, ABS was seen as a perfect vehicle for change. According to Sword, once you get the technology right, you can load any strike zone you want into the system. 'It might be a triangle, or a blob, or something shaped like Texas. Over time, as baseball evolves, ABS can allow the zone to change with it.'</p>
<p>In the past twenty years, sports have moved away from judgment calls. Soccer has Video Assistant Referees (for offside decisions, for example). Tennis has Hawk-Eye (for line calls, for example). For almost a decade, baseball has used instant replay on the base paths. This is widely liked, even if the precision can sometimes cause problems. But these applications deal with something physical: bases, lines, goals. The boundaries of action are precise, delineated like the keys of a piano. This is not the case with ABS and the strike zone. Historically, a certain discretion has been appreciated.</p>
<p>I decided to email Alva Noë, a professor at Berkeley University and a baseball fan, for his opinion. 'Hardly a day goes by that I don't wake up and run through the reasons that this [robo-umpires] is such a terrible idea,' he replied. He later told me, 'This is part of a movement to use algorithms to take the hard choices of living out of life.' Perhaps he's right. We watch baseball to kill time, not to maximize it. Some players I have met take a dissenting stance toward the robots too, believing that accuracy is not the answer. According to Joe Russo, who plays for a New Jersey team, 'With technology, people just want everything to be perfect. That's not reality. I think perfect would be weird. Your teams are always winning, work is always just great, there's always money in your pocket, your car never breaks down. What is there to talk about?'</p>
<p><small>* strike: a strike is when the batter swings at a ball and misses or when the batter does not swing at a ball that passes through the strike zone.</small></p>`,
      questions: [
        {
          number: 27,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? When DeJesus first used ABS, he shared decision-making about strikes with it.',
          choices: [
            { label: 'A', content: 'YES' },
            { label: 'B', content: 'NO', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['yes-no-notgiven'],
          explanation: '"Instead of making any judgments himself" — ông không tham gia quyết định, chỉ đọc lại.',
        },
        {
          number: 28,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? MLB considered it necessary to amend the size of the strike zone when criticisms were received from players.',
          choices: [
            { label: 'A', content: 'YES', isCorrect: true },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['yes-no-notgiven'],
          explanation: '"players complained… In response, MLB decided to tweak the dimensions of the zone".',
        },
        {
          number: 29,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "Do the following statements agree with the claims of the writer? MLB is keen to justify the money spent on improving the accuracy of ABS's calculations.",
          choices: [
            { label: 'A', content: 'YES' },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['yes-no-notgiven'],
          explanation: 'Bài không nhắc gì tới chi phí hay việc MLB phải biện minh cho khoản chi.',
        },
        {
          number: 30,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? The hundred-mile-an-hour fastball led to a more exciting style of play.',
          choices: [
            { label: 'A', content: 'YES' },
            { label: 'B', content: 'NO', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['yes-no-notgiven'],
          explanation: 'Ngược lại: "It flattened the game… a type of play lacking much action".',
        },
        {
          number: 31,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "Do the following statements agree with the claims of the writer? The differing proposals for alterations to the baseball bat led to fierce debate on Sword's team.",
          choices: [
            { label: 'A', content: 'YES' },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['yes-no-notgiven'],
          explanation: 'Có nói họ bàn tới việc đổi gậy, nhưng không nói tranh luận gay gắt.',
        },
        {
          number: 32,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Do the following statements agree with the claims of the writer? ABS makes changes to the shape of the strike zone feasible.',
          choices: [
            { label: 'A', content: 'YES', isCorrect: true },
            { label: 'B', content: 'NO' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['yes-no-notgiven'],
          explanation: '"you can load any strike zone you want into the system… a triangle, or a blob".',
        },
        {
          number: 33,
          type: 'SINGLE_CHOICE',
          content: 'Complete the summary using the list of phrases. Even after ABS was developed, MLB still wanted human umpires to shout out decisions as they had in their ________.',
          choices: [
            { label: 'A', content: 'pitch boundary' },
            { label: 'B', content: 'numerous disputes' },
            { label: 'C', content: 'team tactics' },
            { label: 'D', content: 'subjective assessment' },
            { label: 'E', content: 'widespread approval' },
            { label: 'F', content: 'former roles', isCorrect: true },
            { label: 'G', content: 'total silence' },
            { label: 'H', content: 'perceived area' },
          ],
          difficulty: 'MEDIUM',
          tags: ['summary-list'],
          explanation: '"wanted human umpires to announce the calls, just as they would have done in the past".',
        },
        {
          number: 34,
          type: 'SINGLE_CHOICE',
          content: "Complete the summary using the list of phrases. The umpire's job had, at one time, required a ________ about whether a ball was a strike.",
          choices: [
            { label: 'A', content: 'pitch boundary' },
            { label: 'B', content: 'numerous disputes' },
            { label: 'C', content: 'team tactics' },
            { label: 'D', content: 'subjective assessment', isCorrect: true },
            { label: 'E', content: 'widespread approval' },
            { label: 'F', content: 'former roles' },
            { label: 'G', content: 'total silence' },
            { label: 'H', content: 'perceived area' },
          ],
          difficulty: 'MEDIUM',
          tags: ['summary-list'],
          explanation: '"calling a strike was a judgment call on the part of the umpire".',
        },
        {
          number: 35,
          type: 'SINGLE_CHOICE',
          content: 'Complete the summary using the list of phrases. A ball is considered a strike when the batter does not hit it and it crosses through a ________ extending approximately from the batter\'s knee to his chest.',
          choices: [
            { label: 'A', content: 'pitch boundary' },
            { label: 'B', content: 'numerous disputes' },
            { label: 'C', content: 'team tactics' },
            { label: 'D', content: 'subjective assessment' },
            { label: 'E', content: 'widespread approval' },
            { label: 'F', content: 'former roles' },
            { label: 'G', content: 'total silence' },
            { label: 'H', content: 'perceived area', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['summary-list'],
          explanation: '"an imaginary zone… stretching from the batter\'s knees to the middle of his chest".',
        },
        {
          number: 36,
          type: 'SINGLE_CHOICE',
          content: 'Complete the summary using the list of phrases. In the past, ________ over strike calls were not uncommon, but today everyone accepts the complete ban on pushing or shoving the umpire.',
          choices: [
            { label: 'A', content: 'pitch boundary' },
            { label: 'B', content: 'numerous disputes', isCorrect: true },
            { label: 'C', content: 'team tactics' },
            { label: 'D', content: 'subjective assessment' },
            { label: 'E', content: 'widespread approval' },
            { label: 'F', content: 'former roles' },
            { label: 'G', content: 'total silence' },
            { label: 'H', content: 'perceived area' },
          ],
          difficulty: 'MEDIUM',
          tags: ['summary-list'],
          explanation: '"countless arguments between a team\'s manager and the umpire".',
        },
        {
          number: 37,
          type: 'SINGLE_CHOICE',
          content: 'Complete the summary using the list of phrases. One difference, however, is that during the first game DeJesus used ABS, strike calls were met with ________.',
          choices: [
            { label: 'A', content: 'pitch boundary' },
            { label: 'B', content: 'numerous disputes' },
            { label: 'C', content: 'team tactics' },
            { label: 'D', content: 'subjective assessment' },
            { label: 'E', content: 'widespread approval' },
            { label: 'F', content: 'former roles' },
            { label: 'G', content: 'total silence', isCorrect: true },
            { label: 'H', content: 'perceived area' },
          ],
          difficulty: 'EASY',
          tags: ['summary-list'],
          explanation: '"there was no heckling and no shouted disagreement. Nobody said a word."',
        },
        {
          number: 38,
          type: 'SINGLE_CHOICE',
          content: 'What does the writer suggest about ABS in the fifth paragraph?',
          choices: [
            { label: 'A', content: 'It is bound to make key decisions that are wrong.' },
            { label: 'B', content: 'It may reduce some of the appeal of the game.', isCorrect: true },
            { label: 'C', content: 'It will lead to the disappearance of human umpires.' },
            { label: 'D', content: 'It may increase calls for the rules of baseball to be changed.' },
          ],
          difficulty: 'HARD',
          tags: ['multiple-choice'],
          explanation: 'Đoạn về Viola: máy "unforgiving and pedantic", mất đi cuộc đối thoại giữa pitcher và trọng tài.',
        },
        {
          number: 39,
          type: 'SINGLE_CHOICE',
          content: 'Morgan Sword says that the introduction of ABS',
          choices: [
            { label: 'A', content: 'was regarded as an experiment without a guaranteed outcome.' },
            { label: 'B', content: 'was intended to keep up with developments in other sports.' },
            { label: 'C', content: 'was a response to changing attitudes about the role of sport.' },
            { label: 'D', content: 'was an attempt to ensure baseball retained a young audience.', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['multiple-choice'],
          explanation: '"executives are terrified of losing younger fans, as has been the case with horse racing and boxing".',
        },
        {
          number: 40,
          type: 'SINGLE_CHOICE',
          content: 'Why does the writer include the views of Noë and Russo?',
          choices: [
            { label: 'A', content: 'to show that attitudes to technology vary widely' },
            { label: 'B', content: 'to argue that people have unrealistic expectations of sport' },
            { label: 'C', content: 'to indicate that accuracy is not the same thing as enjoyment', isCorrect: true },
            { label: 'D', content: 'to suggest that the number of baseball fans needs to increase' },
          ],
          difficulty: 'HARD',
          tags: ['multiple-choice'],
          explanation: 'Cả hai đều cho rằng chính xác tuyệt đối làm mất cái đáng xem: "accuracy is not the answer".',
        },
      ],
    },
  ],
}

export const ieltsCambridgeTest3: SeedSection = {
  skill: 'READING',
  title: 'Academic Reading — Test 3 (Passages 1–3)',
  instructions:
    'You should spend about 20 minutes on each passage. Answer all questions. Spelling must be correct; answers are marked exactly as written.',
  duration: 60 * 60,
  passages: [
    {
      title: 'Frozen Food',
      content: `<p><em>A US perspective on the development of the frozen food industry.</em></p>
<p>At some point in history, humans discovered that ice preserved food. There is evidence that winter ice was stored to preserve food in the summer as far back as 10,000 years ago. Two thousand years ago, the inhabitants of South America's Andean mountains had a unique means of conserving potatoes for later consumption. They froze them overnight, then trampled them to squeeze out the moisture, then dried them in the sun. This preserved their nutritional value — if not their aesthetic appeal.</p>
<p>Natural ice remained the main form of refrigeration until late in the 19th century. In the early 1800s, ship owners from Boston, USA, had enormous blocks of Arctic ice towed all over the Atlantic for the purpose of food preservation. In 1851, railroads first began putting blocks of ice in insulated rail cars to send butter from Ogdensburg, New York, to Boston.</p>
<p>Finally, in 1870, Australian inventors found a way to make 'mechanical ice'. They used a compressor to force a gas — ammonia at first and later Freon — through a condenser. The compressed gas gave up some of its heat as it moved through the condenser. Then the gas was released quickly into a low-pressure evaporator coil where it became liquid and cold. Air was blown over the evaporator coil and then this cooled air passed into an insulated compartment, lowering its temperature to freezing point.</p>
<p>Initially, this process was invented to keep Australian beer cool even in hot weather. But Australian cattlemen were quick to realize that, if they could put this new invention on a ship, they could export meat across the oceans. In 1880, a shipment of Australian beef and mutton was sent, frozen, to England. While the food frozen this way was still palatable, there was some deterioration. During the freezing process, crystals formed within the cells of the food, and when the ice expanded and the cells burst, this spoilt the flavor and texture of the food.</p>
<p>The modern frozen food industry began with the indigenous Inuit people of Canada. In 1912, a biology student in Massachusetts, USA, named Clarence Birdseye, ran out of money and went to Labrador in Canada to trap and trade furs. While he was there, he became fascinated with how the Inuit would quickly freeze fish in the Arctic air. The fish looked and tasted fresh even months later.</p>
<p>Birdseye returned to the USA in 1917 and began developing mechanical freezers capable of quick-freezing food. Birdseye methodically kept inventing better freezers and gradually built a business selling frozen fish from Gloucester, Massachusetts. In 1929, his business was sold and became General Foods, but he stayed with the company as director of research, and his division continued to innovate.</p>
<p>Birdseye was responsible for several key innovations that made the frozen food industry possible. He developed quick-freezing techniques that reduced the damage that crystals caused, as well as the technique of freezing the product in the package it was to be sold in. He also introduced the use of cellophane, the first transparent material for food packaging, which allowed consumers to see the quality of the product. Birdseye products also came in convenient size packages that could be prepared with a minimum of effort.</p>
<p>But there were still obstacles. In the 1930s, few grocery stores could afford to buy freezers for a market that wasn't established yet. So, Birdseye leased inexpensive freezer cases to them. He also leased insulated railroad cars so that he could ship his products nationwide. However, few consumers had freezers large enough or efficient enough to take advantage of the products.</p>
<p>Sales increased in the early 1940s, when World War II gave a boost to the frozen food industry because tin was being used for munitions. Canned foods were rationed to save tin for the war effort, while frozen foods were abundant and cheap. Finally, by the 1950s, refrigerator technology had developed far enough to make these appliances affordable for the average family. By 1953, 33 million US families owned a refrigerator, and manufacturers were gradually increasing the size of the freezer compartments in them.</p>
<p>1950s families were also looking for convenience at mealtimes, so the moment was right for the arrival of the 'TV Dinner'. Swanson Foods was a large, nationally recognized producer of canned and frozen poultry. In 1954, the company adapted some of Birdseye's freezing techniques, and with the help of a clever name and a huge advertising budget, it launched the first 'TV Dinner'. This consisted of frozen turkey, potatoes and vegetables served in the same segmented aluminum tray that was used by airlines. The product was an instant success. Within a year, Swanson had sold 13 million TV dinners. American consumers couldn't resist the combination of a trusted brand name, a single-serving package and the convenience of a meal that could be ready after only 25 minutes in a hot oven. By 1959, Americans were spending $2.7 billion annually on frozen foods, and half a billion of that was spent on ready-prepared meals such as the TV Dinner.</p>
<p>Today, the US frozen food industry has a turnover of over $67 billion annually, with $26.6 billion of that sold to consumers for home consumption. The remaining $40 billion in frozen food sales come through restaurants, cafeterias, hospitals and schools, and that represents a third of the total food service sales.</p>`,
      questions: [
        {
          number: 1,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. 2,000 years ago, South America — people conserved the nutritional value of ________, using a method of freezing then drying.',
          correctText: ['potatoes', 'potato'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 1: người vùng Andes bảo quản khoai tây bằng cách đông rồi phơi khô.',
        },
        {
          number: 2,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. 1851, USA — ________ was kept cool by ice during transportation in specially adapted trains.',
          correctText: ['butter'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 2: toa tàu cách nhiệt chở bơ từ Ogdensburg về Boston.',
        },
        {
          number: 3,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. 1880, Australia — two kinds of ________ were the first frozen food shipped to England.',
          correctText: ['meat'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Đoạn 4: thịt bò và thịt cừu — hai loại thịt.',
        },
        {
          number: 4,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. 1917 onwards, USA — Birdseye introduced quick-freezing methods, so that ________ did not spoil the food.',
          correctText: ['crystals', 'crystal'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: '"quick-freezing techniques that reduced the damage that crystals caused".',
        },
        {
          number: 5,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. 1917 onwards, USA — Birdseye packaged products with ________, so the product was visible.',
          correctText: ['cellophane'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: '"the first transparent material for food packaging, which allowed consumers to see the quality".',
        },
        {
          number: 6,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. Early 1940s, USA — frozen food became popular because of a shortage of ________.',
          correctText: ['tin'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: 'Thiếc dùng cho đạn dược nên đồ hộp bị hạn chế.',
        },
        {
          number: 7,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. 1950s, USA — a large number of homes now had a ________.',
          correctText: ['refrigerator', 'fridge'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: '"By 1953, 33 million US families owned a refrigerator".',
        },
        {
          number: 8,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'The ice transportation business made some Boston ship owners very wealthy in the early 1800s.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Bài kể họ kéo băng khắp Đại Tây Dương nhưng không nói ai giàu lên.',
        },
        {
          number: 9,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'A disadvantage of the freezing process invented in Australia was that it affected the taste of food.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 4: tinh thể làm vỡ tế bào, "spoilt the flavor and texture".',
        },
        {
          number: 10,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Clarence Birdseye travelled to Labrador in order to learn how the Inuit people froze fish.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Ông tới đó để bẫy và buôn lông thú; chuyện cá đông lạnh là phát hiện tình cờ khi ở đó.',
        },
        {
          number: 11,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Swanson Foods invested a great deal of money in the promotion of the TV Dinner.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: '"with the help of a clever name and a huge advertising budget".',
        },
        {
          number: 12,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'Swanson Foods developed a new style of container for the launch of the TV Dinner.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Khay nhôm chia ngăn là loại "used by airlines" — có sẵn, không phải mới.',
        },
        {
          number: 13,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'The US frozen food industry is currently the largest in the world.',
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Bài chỉ nói quy mô ngành ở Mỹ, không so với nước nào khác.',
        },
      ],
    },
    {
      title: "Can the planet's coral reefs be saved?",
      content: `<p><strong>A</strong>&nbsp; Conservationists have put the final touches to a giant artificial reef they have been assembling at the world-renowned Zoological Society of London (London Zoo).</p>
<p>Samples of the planet's most spectacular corals — vivid green branching coral, yellow scroll, blue ridge and many more species — have been added to the giant tank along with fish that thrive in their presence: blue tang, clownfish and many others. The reef is in the zoo's new gallery, Tiny Giants, which is dedicated to the minuscule invertebrate creatures that sustain life across the planet. The coral reef tank and its seven-metre-wide window form the core of the exhibition.</p>
<p>'Coral reefs are the most diverse ecosystems on Earth and we want to show people how wonderful they are,' said Paul Pearce-Kelly, senior curator of invertebrates and fish at the Zoological Society of London. 'However, we also want to highlight the research and conservation efforts that are now being carried out to try to save them from the threat of global warming.' They want people to see what is being done to try to save these wonders.</p>
<p><strong>B</strong>&nbsp; Corals are composed of tiny animals, known as polyps, with tentacles for capturing small marine creatures in the sea water. These polyps are transparent but get their brilliant tones of pink, orange, blue, green, etc. from algae that live within them, which in turn get protection, while their photosynthesising of the sun's rays provides nutrients for the polyps. This comfortable symbiotic relationship has led to the growth of coral reefs that cover 0.1% of the planet's ocean bed while providing homes for more than 25% of marine species, including fish, molluscs, sponges and shellfish.</p>
<p><strong>C</strong>&nbsp; As a result, coral reefs are often described as the 'rainforests of the sea', though the comparison is dismissed by some naturalists, including David Attenborough. 'People say you cannot beat the rainforest,' Attenborough has stated. 'But that is simply not true. You go there and the first thing you think is: where … are the birds? Where are the animals? They are hiding in the trees, of course. No, if you want beauty and wildlife, you want a coral reef. Put on a mask and stick your head under the water. The sight is mind-blowing.'</p>
<p><strong>D</strong>&nbsp; Unfortunately, these majestic sights are now under very serious threat, with the most immediate problem coming in the form of thermal stress. Rising ocean temperatures are triggering bleaching events that strip reefs of their colour and eventually kill them. And that is just the start. Other menaces include ocean acidification, sea level increase, pollution by humans, deoxygenation and ocean current changes, while the climate crisis is also increasing habitat destruction. As a result, vast areas — including massive chunks of Australia's Great Barrier Reef — have already been destroyed, and scientists advise that more than 90% of reefs could be lost by 2050 unless urgent action is taken to tackle global heating and greenhouse gas emissions.</p>
<p>Pearce-Kelly says that coral reefs have to survive really harsh conditions — wave erosion and other factors. And 'when things start to go wrong in the oceans, then corals will be the first to react. And that is exactly what we are seeing now. Coral reefs are dying and they are telling us that all is not well with our planet.'</p>
<p><strong>E</strong>&nbsp; However, scientists are trying to pinpoint hardy types of coral that could survive our overheated oceans, and some of this research will be carried out at London Zoo. 'Behind our … coral reef tank we have built laboratories where scientists will be studying coral species,' said Pearce-Kelly. One aim will be to carry out research on species to find those that can survive best in warm, acidic waters. Another will be to try to increase coral breeding rates. 'Coral spawn just once a year,' he added. 'However, aquarium-based research has enabled some corals to spawn artificially, which can assist coral reef restoration efforts. And if this can be extended for all species, we could consider the launching of coral-spawning programmes several times a year. That would be a big help in restoring blighted reefs.'</p>
<p><strong>F</strong>&nbsp; Research in these fields is being conducted in laboratories around the world, with the London Zoo centre linked to this global network. Studies carried out in one centre can then be tested in others. The resulting young coral can then be displayed in the tank in Tiny Giants. 'The crucial point is that the progress we make in making coral better able to survive in a warming world can be shown to the public and encourage them to believe that we can do something to save the planet's reefs,' said Pearce-Kelly. 'Saving our coral reefs is now a critically important ecological goal.'</p>`,
      questions: [
        {
          number: 14,
          type: 'SINGLE_CHOICE',
          content: 'Choose the correct heading for Section A from the list below.',
          choices: [
            { label: 'i', content: 'Tried and tested solutions' },
            { label: 'ii', content: 'Cooperation beneath the waves' },
            { label: 'iii', content: 'Working to lessen the problems' },
            { label: 'iv', content: 'Disagreement about the accuracy of a certain phrase' },
            { label: 'v', content: 'Two clear educational goals', isCorrect: true },
            { label: 'vi', content: 'Promoting hope' },
            { label: 'vii', content: 'A warning of further trouble ahead' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-headings'],
          explanation: 'Mục A: vừa muốn cho công chúng thấy rạn san hô đẹp thế nào, vừa muốn nêu bật nỗ lực nghiên cứu.',
        },
        {
          number: 15,
          type: 'SINGLE_CHOICE',
          content: 'Choose the correct heading for Section B from the list below.',
          choices: [
            { label: 'i', content: 'Tried and tested solutions' },
            { label: 'ii', content: 'Cooperation beneath the waves', isCorrect: true },
            { label: 'iii', content: 'Working to lessen the problems' },
            { label: 'iv', content: 'Disagreement about the accuracy of a certain phrase' },
            { label: 'v', content: 'Two clear educational goals' },
            { label: 'vi', content: 'Promoting hope' },
            { label: 'vii', content: 'A warning of further trouble ahead' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-headings'],
          explanation: 'Mục B tả quan hệ cộng sinh giữa polyp và tảo — hợp tác dưới nước.',
        },
        {
          number: 16,
          type: 'SINGLE_CHOICE',
          content: 'Choose the correct heading for Section C from the list below.',
          choices: [
            { label: 'i', content: 'Tried and tested solutions' },
            { label: 'ii', content: 'Cooperation beneath the waves' },
            { label: 'iii', content: 'Working to lessen the problems' },
            { label: 'iv', content: 'Disagreement about the accuracy of a certain phrase', isCorrect: true },
            { label: 'v', content: 'Two clear educational goals' },
            { label: 'vi', content: 'Promoting hope' },
            { label: 'vii', content: 'A warning of further trouble ahead' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-headings'],
          explanation: 'Mục C: Attenborough bác cách gọi "rainforests of the sea".',
        },
        {
          number: 17,
          type: 'SINGLE_CHOICE',
          content: 'Choose the correct heading for Section D from the list below.',
          choices: [
            { label: 'i', content: 'Tried and tested solutions' },
            { label: 'ii', content: 'Cooperation beneath the waves' },
            { label: 'iii', content: 'Working to lessen the problems' },
            { label: 'iv', content: 'Disagreement about the accuracy of a certain phrase' },
            { label: 'v', content: 'Two clear educational goals' },
            { label: 'vi', content: 'Promoting hope' },
            { label: 'vii', content: 'A warning of further trouble ahead', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-headings'],
          explanation: 'Mục D: "And that is just the start" — liệt kê hàng loạt mối nguy còn ở phía trước.',
        },
        {
          number: 18,
          type: 'SINGLE_CHOICE',
          content: 'Choose the correct heading for Section E from the list below.',
          choices: [
            { label: 'i', content: 'Tried and tested solutions' },
            { label: 'ii', content: 'Cooperation beneath the waves' },
            { label: 'iii', content: 'Working to lessen the problems', isCorrect: true },
            { label: 'iv', content: 'Disagreement about the accuracy of a certain phrase' },
            { label: 'v', content: 'Two clear educational goals' },
            { label: 'vi', content: 'Promoting hope' },
            { label: 'vii', content: 'A warning of further trouble ahead' },
          ],
          difficulty: 'HARD',
          tags: ['matching-headings'],
          explanation: 'Mục E: tìm loài chịu nhiệt, tăng tỉ lệ sinh sản — đang làm để giảm bớt vấn đề, chưa phải giải pháp đã kiểm chứng.',
        },
        {
          number: 19,
          type: 'SINGLE_CHOICE',
          content: 'Choose the correct heading for Section F from the list below.',
          choices: [
            { label: 'i', content: 'Tried and tested solutions' },
            { label: 'ii', content: 'Cooperation beneath the waves' },
            { label: 'iii', content: 'Working to lessen the problems' },
            { label: 'iv', content: 'Disagreement about the accuracy of a certain phrase' },
            { label: 'v', content: 'Two clear educational goals' },
            { label: 'vi', content: 'Promoting hope', isCorrect: true },
            { label: 'vii', content: 'A warning of further trouble ahead' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-headings'],
          explanation: 'Mục F: cho công chúng thấy tiến bộ để họ "believe that we can do something".',
        },
        {
          number: 20,
          type: 'MULTI_CHOICE',
          content: 'Questions 20–21. Choose TWO letters, A–E. Which TWO of these causes of damage to coral reefs are mentioned by the writer of the text?',
          choices: [
            { label: 'A', content: 'a rising number of extreme storms' },
            { label: 'B', content: 'the removal of too many fish from the sea' },
            { label: 'C', content: 'the contamination of the sea from waste', isCorrect: true },
            { label: 'D', content: 'increased disease among marine species' },
            { label: 'E', content: 'alterations in the usual flow of water in the seas', isCorrect: true },
          ],
          points: 2,
          difficulty: 'MEDIUM',
          tags: ['multiple-answer'],
          explanation: 'Mục D: "pollution by humans" và "ocean current changes".',
        },
        {
          number: 22,
          type: 'MULTI_CHOICE',
          content: 'Questions 22–23. Choose TWO letters, A–E. Which TWO of the following statements are true of the researchers at London Zoo?',
          choices: [
            { label: 'A', content: 'They are hoping to expand the numbers of different corals being bred in laboratories.' },
            { label: 'B', content: 'They want to identify corals that can cope well with the changed sea conditions.', isCorrect: true },
            { label: 'C', content: 'They are looking at ways of creating artificial reefs that corals could grow on.' },
            { label: 'D', content: 'They are trying out methods that would speed up reproduction in some corals.', isCorrect: true },
            { label: 'E', content: 'They are investigating materials that might protect reefs from higher temperatures.' },
          ],
          points: 2,
          difficulty: 'HARD',
          tags: ['multiple-answer'],
          explanation: 'Mục E: tìm loài sống được trong nước ấm và axit, và tăng tỉ lệ sinh sản của san hô.',
        },
        {
          number: 24,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. Corals have a number of ________ which they use to collect their food.',
          correctText: ['tentacles', 'tentacle'],
          difficulty: 'EASY',
          tags: ['sentence-completion'],
          explanation: 'Mục B: "polyps, with tentacles for capturing small marine creatures".',
        },
        {
          number: 25,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. Algae gain ________ from being inside the coral.',
          correctText: ['protection'],
          difficulty: 'MEDIUM',
          tags: ['sentence-completion'],
          explanation: 'Mục B: "algae that live within them, which in turn get protection".',
        },
        {
          number: 26,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. Increases in the warmth of the sea water can remove the ________ from coral.',
          correctText: ['colour', 'color'],
          difficulty: 'MEDIUM',
          tags: ['sentence-completion'],
          explanation: 'Mục D: "bleaching events that strip reefs of their colour".',
        },
      ],
    },
    {
      title: 'Robots and us',
      content: `<p><em>Three leaders in their fields answer questions about our relationships with robots.</em></p>
<p>When asked 'Should robots be used to colonise other planets?', cosmology and astrophysics Professor Martin Rees said he believed the solar system would be mapped by robotic craft by the end of the century. 'The next step would be mining of asteroids, enabling fabrication of large structures in space without having to bring all the raw materials from Earth. … I think this is more realistic and benign than the … "terraforming"* of planets.' He maintains that colonised planets 'should be preserved with a status that is analogous to Antarctica here on Earth.'</p>
<p>On the question of using robots to colonise other planets and exploit mineral resources, engineering Professor Daniel Wolpert replied, 'I don't see a pressing need to colonise other planets unless we can bring [these] resources back to Earth. The vast majority of Earth is currently inaccessible to us. Using robots to gather resources nearer to home would seem to be a better use of our robotic tools.'</p>
<p>Meanwhile, for anthropology Professor Kathleen Richardson, the idea of 'colonisation' of other planets seemed morally dubious: 'I think whether we do something on Earth or on Mars we should always do it in the spirit of a genuine interest in "the Other", not to impose a particular model, but to meet "the Other".'</p>
<p>In response to the second question, 'How soon will machine intelligence outstrip human intelligence?', Rees mentions robots that are advanced enough to beat humans at chess, but then goes on to say, 'Robots are still limited in their ability to sense their environment: they can't yet recognise and move the pieces on a real chessboard as cleverly as a child can. Later this century, however, their more advanced successors may relate to their surroundings, and to people, as adeptly as we do. Moral questions then arise. … Should we feel guilty about exploiting [sophisticated robots]? Should we fret if they are underemployed, frustrated, or bored?'</p>
<p>Wolpert's response to the question about machine intelligence outstripping human intelligence was this: 'In a limited sense it already has. Machines can already navigate, remember and search for items with an ability that far outstrips humans. However, there is no machine that can identify visual objects or speech with the reliability and flexibility of humans. … Expecting a machine close to the creative intelligence of a human within the next 50 years would be highly ambitious.'</p>
<p>Richardson believes that our fear of machines becoming too advanced has more to do with human nature than anything intrinsic to the machines themselves. In her view, it stems from humans' tendency to personify inanimate objects: we create machines based on representations of ourselves, imagine that machines think and behave as we do, and therefore see them as an autonomous threat. 'One of the consequences of thinking that the problem lies with machines is that … we tend to imagine they are greater and more powerful than they really are and subsequently they become so.'</p>
<p>This led on to the third question, 'Should we be scared by advances in artificial intelligence?' To this question, Rees replied, 'Those who should be worried are the futurologists who believe in the so-called "singularity".** … And another worry is that we are increasingly dependent on computer networks, and that these could behave like a single "brain" with a mind of its own, and with goals that may be contrary to human welfare. I think we should ensure that robots remain as no more than "idiot savants" lacking the capacity to outwit us, even though they may greatly surpass us in the ability to calculate and process information.'</p>
<p>Wolpert's response was to say that we have already seen the damaging effects of artificial intelligence in the form of computer viruses. 'But in this case,' he says, 'the real intelligence is the malicious designer. Critically, the benefits of computers outweigh the damage that computer viruses cause. Similarly, while there may be misuses of robotics in the near future, the benefits that they will bring are likely to outweigh these negative aspects.'</p>
<p>Richardson's response to this question was this: 'We need to ask why fears of artificial intelligence and robots persist; none have in fact risen up and challenged human supremacy.' She believes that as robots have never shown themselves to be a threat to humans, it seems unlikely that they ever will. In fact, she went on, 'Not all fear [robots]; many people welcome machine intelligence.'</p>
<p>In answer to the fourth question, 'What can science fiction tell us about robotics?', Rees replied, 'I sometimes advise students that it's better to read first-rate science fiction than second-rate science — more stimulating, and perhaps no more likely to be wrong.'</p>
<p>As his response, Wolpert commented, 'Science fiction has often been remarkable at predicting the future. Science fiction has painted a vivid spectrum of possible futures, from cute and helpful robots to dystopian robotic societies. Interestingly, almost no science fiction envisages a future without robots.'</p>
<p>Finally, on the question of science fiction, Richardson pointed out that in modern society, people tend to think there is reality on the one hand, and fiction and fantasy on the other. She then explained that the division did not always exist, and that scientists and technologists made this separation because they wanted to carve out the sphere of their work. 'But the divide is not so clear cut, and that is why the worlds seem to collide at times,' she said. 'In some cases, we need to bring these different understandings together to get a whole perspective. Perhaps then, we won't be so frightened that something we create as a copy of ourselves will be a [threat] to us.'</p>
<p><small>* terraforming: modifying a planet's atmosphere to suit human needs<br>** singularity: the point when robots will be able to start creating ever more sophisticated versions of themselves</small></p>`,
      questions: [
        {
          number: 27,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. For our own safety, humans will need to restrict the abilities of robots. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees', isCorrect: true },
            { label: 'B', content: 'Daniel Wolpert' },
            { label: 'C', content: 'Kathleen Richardson' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Rees: "robots remain as no more than \'idiot savants\' lacking the capacity to outwit us".',
        },
        {
          number: 28,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. The risk of robots harming us is less serious than humans believe it to be. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees' },
            { label: 'B', content: 'Daniel Wolpert' },
            { label: 'C', content: 'Kathleen Richardson', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Richardson: chưa có robot nào thách thức con người, nỗi sợ nằm ở bản tính người.',
        },
        {
          number: 29,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. It will take many decades for robot intelligence to be as imaginative as human intelligence. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees' },
            { label: 'B', content: 'Daniel Wolpert', isCorrect: true },
            { label: 'C', content: 'Kathleen Richardson' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Wolpert: trong 50 năm tới mà đạt tới trí sáng tạo của con người đã là quá tham vọng.',
        },
        {
          number: 30,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. We may have to start considering whether we are treating robots fairly. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees', isCorrect: true },
            { label: 'B', content: 'Daniel Wolpert' },
            { label: 'C', content: 'Kathleen Richardson' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Rees: "Should we feel guilty about exploiting [sophisticated robots]?"',
        },
        {
          number: 31,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. Robots are probably of more help to us on Earth than in space. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees' },
            { label: 'B', content: 'Daniel Wolpert', isCorrect: true },
            { label: 'C', content: 'Kathleen Richardson' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Wolpert: "Using robots to gather resources nearer to home would seem to be a better use".',
        },
        {
          number: 32,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. The ideas in high-quality science fiction may prove to be just as accurate as those found in the work of mediocre scientists. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees', isCorrect: true },
            { label: 'B', content: 'Daniel Wolpert' },
            { label: 'C', content: 'Kathleen Richardson' },
          ],
          difficulty: 'HARD',
          tags: ['matching-people'],
          explanation: 'Rees: đọc khoa học viễn tưởng hạng nhất còn hơn khoa học hạng hai, "no more likely to be wrong".',
        },
        {
          number: 33,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct expert. There are those who look forward to robots developing greater intelligence. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Martin Rees' },
            { label: 'B', content: 'Daniel Wolpert' },
            { label: 'C', content: 'Kathleen Richardson', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Richardson: "many people welcome machine intelligence".',
        },
        {
          number: 34,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. Richardson and Rees express similar views regarding the ethical aspect of…',
          choices: [
            { label: 'A', content: 'robots to explore outer space.' },
            { label: 'B', content: 'advances made in machine intelligence so far.' },
            { label: 'C', content: 'changes made to other planets for our own benefit.', isCorrect: true },
            { label: 'D', content: 'the harm already done by artificial intelligence.' },
          ],
          difficulty: 'HARD',
          tags: ['sentence-endings'],
          explanation: 'Rees muốn hành tinh được giữ như Nam Cực; Richardson thấy "colonisation" đáng ngờ về đạo đức.',
        },
        {
          number: 35,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. Rees and Wolpert share an opinion about the extent of…',
          choices: [
            { label: 'A', content: 'robots to explore outer space.' },
            { label: 'B', content: 'advances made in machine intelligence so far.', isCorrect: true },
            { label: 'C', content: 'changes made to other planets for our own benefit.' },
            { label: 'D', content: 'the harm already done by artificial intelligence.' },
          ],
          difficulty: 'HARD',
          tags: ['sentence-endings'],
          explanation: 'Cả hai đều nói máy đã giỏi ở vài việc nhưng còn kém xa con người ở nhận biết môi trường.',
        },
        {
          number: 36,
          type: 'SINGLE_CHOICE',
          content: 'Complete the sentence with the correct ending. Wolpert disagrees with Richardson on the question of…',
          choices: [
            { label: 'A', content: 'robots to explore outer space.' },
            { label: 'B', content: 'advances made in machine intelligence so far.' },
            { label: 'C', content: 'changes made to other planets for our own benefit.' },
            { label: 'D', content: 'the harm already done by artificial intelligence.', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['sentence-endings'],
          explanation: 'Wolpert nêu virus máy tính là thiệt hại đã có; Richardson cho rằng robot chưa từng gây hại.',
        },
        {
          number: 37,
          type: 'SINGLE_CHOICE',
          content: 'What point does Richardson make about fear of machines?',
          choices: [
            { label: 'A', content: 'It has grown alongside the development of ever more advanced robots.' },
            { label: 'B', content: 'It is the result of our inclination to attribute human characteristics to non-human entities.', isCorrect: true },
            { label: 'C', content: 'It has its origins in basic misunderstandings about how inanimate objects function.' },
            { label: 'D', content: 'It demonstrates a key difference between human intelligence and machine intelligence.' },
          ],
          difficulty: 'MEDIUM',
          tags: ['multiple-choice'],
          explanation: '"humans\' tendency to personify inanimate objects".',
        },
        {
          number: 38,
          type: 'SINGLE_CHOICE',
          content: 'What potential advance does Rees see as a cause for concern?',
          choices: [
            { label: 'A', content: 'robots outnumbering people' },
            { label: 'B', content: 'robots having abilities which humans do not' },
            { label: 'C', content: 'artificial intelligence developing independent thought', isCorrect: true },
            { label: 'D', content: 'artificial intelligence taking over every aspect of our lives' },
          ],
          difficulty: 'MEDIUM',
          tags: ['multiple-choice'],
          explanation: 'Rees lo mạng máy tính hành xử như "a single \'brain\' with a mind of its own".',
        },
        {
          number: 39,
          type: 'SINGLE_CHOICE',
          content: 'What does Wolpert emphasise in his response to the question about science fiction?',
          choices: [
            { label: 'A', content: 'how science fiction influences our attitudes to robots' },
            { label: 'B', content: 'how fundamental robots are to the science fiction genre', isCorrect: true },
            { label: 'C', content: 'how the image of robots in science fiction has changed over time' },
            { label: 'D', content: 'how reactions to similar portrayals of robots in science fiction may vary' },
          ],
          difficulty: 'HARD',
          tags: ['multiple-choice'],
          explanation: '"almost no science fiction envisages a future without robots".',
        },
        {
          number: 40,
          type: 'SINGLE_CHOICE',
          content: 'What is Richardson doing in her comment about reality and fantasy?',
          choices: [
            { label: 'A', content: 'warning people not to confuse one with the other' },
            { label: 'B', content: 'outlining ways in which one has impacted on the other' },
            { label: 'C', content: 'recommending a change of approach in how people view them', isCorrect: true },
            { label: 'D', content: 'explaining why scientists have a different perspective on them from other people' },
          ],
          difficulty: 'HARD',
          tags: ['multiple-choice'],
          explanation: '"we need to bring these different understandings together to get a whole perspective".',
        },
      ],
    },
  ],
}

export const ieltsCambridgeTest4: SeedSection = {
  skill: 'READING',
  title: 'Academic Reading — Test 4 (Passages 1–3)',
  instructions:
    'You should spend about 20 minutes on each passage. Answer all questions. Spelling must be correct; answers are marked exactly as written.',
  duration: 60 * 60,
  passages: [
    {
      title: "Georgia O'Keeffe",
      content: `<p>For seven decades, Georgia O'Keeffe (1887–1986) was a major figure in American art. Remarkably, she remained independent from shifting art trends and her work stayed true to her own vision, which was based on finding the essential, abstract forms in nature. With exceptionally keen powers of observation and great finesse with a paintbrush, she recorded subtle nuances of colour, shape, and light that enlivened her paintings and attracted a wide audience.</p>
<p>Born in 1887 near Sun Prairie, Wisconsin to cattle breeders Francis and Ida O'Keeffe, Georgia was raised on their farm along with her six siblings. By the time she graduated from high school in 1905, she had determined to make her way as an artist. She studied the techniques of traditional painting at the Art Institute of Chicago school (1905) and the Art Students League of New York (1907–8). After attending university and then training college, she became an art teacher and taught in elementary schools, high schools, and colleges in Virginia, Texas, and South Carolina from 1911 to 1918.</p>
<p>During this period, O'Keeffe began to experiment with creating abstract compositions in charcoal, and produced a series of innovative drawings that led her art in a new direction. She sent some of these drawings to a friend in New York, who showed them to art collector and photographer Alfred Stieglitz in January 1916.</p>
<p>Stieglitz was impressed, and exhibited the drawings later that year at his gallery on Fifth Avenue, New York City, where the works of many avant-garde artists and photographers were introduced to the American public.</p>
<p>With Stieglitz's encouragement and promise of financial support, O'Keeffe arrived in New York in June 1918 to begin a career as an artist. For the next three decades, Stieglitz vigorously promoted her work in twenty-two solo exhibitions and numerous group installations. The two were married in 1924. The ups and downs of their personal and professional relationship were recorded in Stieglitz's celebrated black-and-white portraits of O'Keeffe, taken over the course of twenty years (1917–37).</p>
<p>By the mid-1920s, O'Keeffe was recognized as one of America's most important and successful artists, widely known for the architectural pictures that dramatically depict the soaring skyscrapers of New York. But most often, she painted botanical subjects, inspired by annual trips to the Stieglitz family summer home. In her magnified images depicting flowers, begun in 1924, O'Keeffe brings the viewer right into the picture.</p>
<p>Enlarging the tiniest details to fill an entire metre-wide canvas emphasized their shapes and lines and made them appear abstract. Such daring compositions helped establish O'Keeffe's reputation as an innovative modernist.</p>
<p>In 1929, O'Keeffe made her first extended trip to the state of New Mexico. It was a visit that had a lasting impact on her life, and an immediate effect on her work. Over the next two decades she made almost annual trips to New Mexico, staying up to six months there, painting in relative solitude, then returning to New York each winter to exhibit the new work at Stieglitz's gallery. This pattern continued until she moved permanently to New Mexico in 1949.</p>
<p>There, O'Keeffe found new inspiration: at first, it was the numerous sun-bleached bones she came across in the state's rugged terrain that sparked her imagination. Two of her earliest and most celebrated Southwestern paintings exquisitely reproduce a cow skull's weathered surfaces, jagged edges, and irregular openings. Later, she also explored another variation on this theme in her large series of Pelvis pictures, which focused on the contrasts between convex and concave surfaces, and solid and open spaces.</p>
<p>However, it was the region's spectacular landscape, with its unusual geological formations, vivid colours, clarity of light, and exotic vegetation, that held the artist's imagination for more than four decades. Often, she painted the rocks, cliffs, and mountains in striking close-up, just as she had done with her botanical subjects.</p>
<p>O'Keeffe eventually owned two homes in New Mexico — the first, her summer retreat at Ghost Ranch, was nestled beneath 200-metre cliffs, while the second, used as her winter residence, was in the small town of Abiquiu. While both locales provided a wealth of imagery for her paintings, one feature of the Abiquiu house — the large walled patio with its black door — was particularly inspirational. In more than thirty pictures between 1946 and 1960, she reinvented the patio into an abstract arrangement of geometric shapes.</p>
<p>From the 1950s into the 1970s, O'Keeffe travelled widely, making trips to Asia, the Middle East, and Europe. Flying in planes inspired her last two major series — aerial views of rivers and expansive paintings of the sky viewed from just above clouds. In both series, O'Keeffe increased the size of her canvases, sometimes to mural proportions, reflecting perhaps her newly expanded view of the world. When in 1965 she successfully translated one of her cloud motifs to a monumental canvas measuring 6 metres in length (with the help of assistants), it was an enormous challenge and a special feat for an artist nearing eighty years of age.</p>
<p>The last two decades of the artist's life were relatively unproductive as ill health and blindness hindered her ability to work. O'Keeffe died in 1986 at the age of ninety-eight, but her rich legacy of some 900 paintings has continued to attract subsequent generations of artists and art lovers who derive inspiration from these very American images.</p>`,
      questions: [
        {
          number: 1,
          type: 'FILL_BLANK',
          content: "Complete the note with ONE WORD ONLY from the passage. The life and work of Georgia O'Keeffe — studied art, then worked as a ________ in various places in the USA.",
          correctText: ['teacher'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 2: "she became an art teacher and taught in elementary schools, high schools, and colleges".',
        },
        {
          number: 2,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. She created drawings using ________ which were exhibited in New York City.',
          correctText: ['charcoal'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: 'Đoạn 3: "abstract compositions in charcoal".',
        },
        {
          number: 3,
          type: 'FILL_BLANK',
          content: "Complete the note with ONE WORD ONLY from the passage. She moved to New York and became famous for her paintings of the city's ________.",
          correctText: ['skyscrapers', 'skyscraper'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: '"the architectural pictures that dramatically depict the soaring skyscrapers of New York".',
        },
        {
          number: 4,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. She produced a series of innovative close-up paintings of ________.',
          correctText: ['flowers', 'flower'],
          difficulty: 'EASY',
          tags: ['note-completion'],
          explanation: '"In her magnified images depicting flowers, begun in 1924".',
        },
        {
          number: 5,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. She went to New Mexico and was initially inspired to paint the many ________ that could be found there.',
          correctText: ['bones', 'bone'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: '"at first, it was the numerous sun-bleached bones… that sparked her imagination".',
        },
        {
          number: 6,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. She continued to paint various features that together formed the dramatic ________ of New Mexico for over forty years.',
          correctText: ['landscape'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: '"the region\'s spectacular landscape… held the artist\'s imagination for more than four decades".',
        },
        {
          number: 7,
          type: 'FILL_BLANK',
          content: 'Complete the note with ONE WORD ONLY from the passage. She travelled widely by plane in later years, and painted pictures of clouds and ________ seen from above.',
          correctText: ['rivers', 'river'],
          difficulty: 'MEDIUM',
          tags: ['note-completion'],
          explanation: '"aerial views of rivers and expansive paintings of the sky".',
        },
        {
          number: 8,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career.",
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: 'Đoạn 1: "she remained independent from shifting art trends".',
        },
        {
          number: 9,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: 'When O\'Keeffe finished high school, she had already made her mind up about the career that she wanted.',
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: '"By the time she graduated from high school in 1905, she had determined to make her way as an artist".',
        },
        {
          number: 10,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "Alfred Stieglitz first discovered O'Keeffe's work when she sent some abstract drawings to his gallery in New York City.",
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE', isCorrect: true },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'MEDIUM',
          tags: ['true-false-notgiven'],
          explanation: 'Bà gửi cho một người bạn ở New York, người này mới đưa cho Stieglitz xem.',
        },
        {
          number: 11,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "O'Keeffe was the subject of Stieglitz's photographic work for many years.",
          choices: [
            { label: 'A', content: 'TRUE', isCorrect: true },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN' },
          ],
          difficulty: 'EASY',
          tags: ['true-false-notgiven'],
          explanation: '"portraits of O\'Keeffe, taken over the course of twenty years (1917–37)".',
        },
        {
          number: 12,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "O'Keeffe's paintings of the patio of her house in Abiquiu were among the artist's favourite works.",
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['true-false-notgiven'],
          explanation: 'Bài nói sân trong là nguồn cảm hứng lớn, nhưng không nói bà thích những bức đó nhất.',
        },
        {
          number: 13,
          type: 'TRUE_FALSE_NOTGIVEN',
          content: "O'Keeffe produced a greater quantity of work during the 1950s to 1970s than at any other time in her life.",
          choices: [
            { label: 'A', content: 'TRUE' },
            { label: 'B', content: 'FALSE' },
            { label: 'C', content: 'NOT GIVEN', isCorrect: true },
          ],
          difficulty: 'HARD',
          tags: ['true-false-notgiven'],
          explanation: 'Có kể bà đi nhiều và vẽ tranh khổ lớn giai đoạn đó, nhưng không so sánh SẢN LƯỢNG với các giai đoạn khác.',
        },
      ],
    },
    {
      title: 'Adapting to the effects of climate change',
      content: `<p><strong>A</strong>&nbsp; All around the world, nations are already preparing for, and adapting to, climate change and its impacts. Even if we stopped all CO2 emissions tomorrow, we would continue to see the impact of the CO2 already released since industrial times, with scientists forecasting that global warming would continue for around 40 years. In the meantime, ice caps would continue to melt and sea levels rise. Some countries and regions will suffer more extreme impacts from these changes than others. It's in these places that innovation is thriving.</p>
<p><strong>B</strong>&nbsp; In Miami Beach, Florida, USA, seawater isn't just breaching the island city's walls, it's seeping up through the ground, so the only way to save the city is to lift it up above sea level. Starting in the lowest and most vulnerable neighbourhoods, roads have been raised by as much as 61 centimetres. The elevation work was carried out as part of Miami Beach's ambitious but much-needed stormwater-management programme. In addition to the road adaptations, the city has set up new pumps that can remove up to 75,000 litres of water per minute. In the face of floods, climate-mitigation strategies have often been overlooked, says Yanira Pineda, a senior sustainability coordinator. She knows that they're essential and that the job is far from over. 'We know that in 20, 30, 40 years, we'll need to go back in there and adjust to the changing environment,' she says.</p>
<p><strong>C</strong>&nbsp; Seawalls are a staple strategy for many coastal communities, but on the soft, muddy northern shores of Java, Indonesia, they frequently collapse, further exacerbating coastal erosion. There have been many attempts to restore the island's coastal mangroves: ecosystems of trees and shrubs that help defend coastal areas by trapping sediment in their net-like root systems, elevating the sea bed and dampening the energy of waves and tidal currents. But Susanna Tol of the not-for-profit organisation Wetlands International says that, while hugely popular, the majority of mangrove-planting projects fail. So, Wetlands International started out with a different approach, building semi-permeable dams, made from bamboo poles and brushwood, to mimic the role of mangrove roots and create favourable conditions for mangroves to grow back naturally. The programme has seen moderate success, mainly in areas with less subsidence. 'Unfortunately, traditional infrastructure is often single-solution focused,' says Tol. 'For long-term success, it's critical that we transition towards multifunctional approaches that embed natural processes and that engage and benefit communities and local decision-makers.'</p>
<p><strong>D</strong>&nbsp; As the floodwaters rose in the rice fields of the Mekong Delta in September 2018, four small houses rose with them. Homes in this part of Vietnam are traditionally built on stilts but these ones had been built to float. The modifications were made by the Buoyant Foundation Project, a not-for-profit organisation that has been researching and retrofitting amphibious houses since 2006. 'When I started this,' explains founder Elizabeth English, 'climate change was not on the tip of everybody's tongue, but this technology is becoming necessary in places that didn't previously need it.' It's much cheaper than permanently elevating houses, English explains — about a third of what it would cost to completely replace a building's foundations. It also avoids the problem of taller houses being at greater risk from wind damage. Another plus comes from the fact that amphibious structures can be sensitively adapted to meet cultural needs and match the kind of houses that are already common in a community.</p>
<p><strong>E</strong>&nbsp; Bangladesh is especially vulnerable to climate change. Most of the country is less than a metre above sea level and 80 per cent of its land lies on floodplains. 'Almost 35 million people living on the coastal belt of Bangladesh are currently affected by soil and water salinity,' says Raisa Chowdhury of the international development organisation ICCO Cooperation. Rather than fighting against it, one project is helping communities adapt to salt-affected soils. ICCO Cooperation has been working with 10,000 farmers in Bangladesh to start cultivating naturally salt-tolerant crops in the region. Certain varieties of carrot, potato, kohlrabi, cabbage and beetroot have been found to be better suited to salty soil than the rice and wheat that is typically grown there. Chowdhury says that the results are very visible, comparing a barren plot of land to the 'beautiful, lush green vegetable garden' sitting beside it, in which he and his team have been working with the farmers. Since the project began, farmers trained in saline agriculture have reported increases of two to three more harvests per year.</p>
<p><strong>F</strong>&nbsp; Greg Spotts from Los Angeles (LA) in the USA is chief sustainability officer of the city's street services department. He leads the Cool Streets LA programme, a series of pilot projects, which include the planting of trees and the installation of a 'cool pavement' system, designed to help reach the city's goal of bringing down its average temperature by 1.5°C. 'Urban cooling is literally a matter of life and death for our future in LA,' says Spotts. Using a Geographic Information System data mapping tool, the programme identified streets with low tree canopy cover in three of the city's neighbourhoods and covered them with a light-grey, light-reflecting coating, which had already been shown to lower road surface temperature in Los Angeles by 6°C. Spotts says one of these streets, in the Winnetka neighbourhood of San Fernando Valley, can now be seen as a pale crescent, the only cool spot on an otherwise red thermal image, from the International Space Station.</p>`,
      questions: [
        {
          number: 14,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? How a type of plant functions as a natural protection for coastlines.',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C', isCorrect: true },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
          ],
          difficulty: 'EASY',
          tags: ['matching-information'],
          explanation: 'Mục C: rễ đước giữ trầm tích, nâng đáy biển, làm dịu năng lượng sóng.',
        },
        {
          number: 15,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? A prediction about how long it could take to stop noticing the effects of climate change.',
          choices: [
            { label: 'A', content: 'Paragraph A', isCorrect: true },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục A: dừng phát thải hôm nay thì trái đất vẫn ấm lên khoảng 40 năm nữa.',
        },
        {
          number: 16,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? A reference to the fact that a solution is particularly cost-effective.',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D', isCorrect: true },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục D: nhà nổi rẻ hơn, chỉ khoảng một phần ba chi phí thay móng.',
        },
        {
          number: 17,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? A mention of a technology used to locate areas most in need of intervention.',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục F: dùng công cụ bản đồ GIS để tìm những phố ít tán cây.',
        },
        {
          number: 18,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. The stormwater-management programme in Miami Beach has involved the installation of efficient ________.',
          correctText: ['pumps', 'pump'],
          difficulty: 'EASY',
          tags: ['sentence-completion'],
          explanation: 'Mục B: "new pumps that can remove up to 75,000 litres of water per minute".',
        },
        {
          number: 19,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. The construction of ________ was the first stage of a project to ensure the success of mangroves in Indonesia.',
          correctText: ['dams', 'dam'],
          difficulty: 'MEDIUM',
          tags: ['sentence-completion'],
          explanation: 'Mục C: "building semi-permeable dams, made from bamboo poles and brushwood".',
        },
        {
          number: 20,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. As a response to rising floodwaters in the Mekong Delta, a not-for-profit organisation has been building houses that can ________.',
          correctText: ['float'],
          difficulty: 'EASY',
          tags: ['sentence-completion'],
          explanation: 'Mục D: "these ones had been built to float".',
        },
        {
          number: 21,
          type: 'FILL_BLANK',
          content: 'Complete the sentence with ONE WORD ONLY from the passage. Rising sea levels in Bangladesh have made it necessary to introduce various ________ that are suitable for areas of high salt content.',
          correctText: ['crops', 'crop'],
          difficulty: 'MEDIUM',
          tags: ['sentence-completion'],
          explanation: 'Mục E: "cultivating naturally salt-tolerant crops".',
        },
        {
          number: 22,
          type: 'FILL_BLANK',
          content: "Complete the sentence with ONE WORD ONLY from the passage. A project in LA has increased the number of ________ on the city's streets.",
          correctText: ['trees', 'tree'],
          difficulty: 'EASY',
          tags: ['sentence-completion'],
          explanation: 'Mục F: chương trình Cool Streets LA gồm việc trồng cây.',
        },
        {
          number: 23,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. It is essential to adopt strategies which involve and help residents of the region.',
          choices: [
            { label: 'A', content: 'Yanira Pineda' },
            { label: 'B', content: 'Susanna Tol', isCorrect: true },
            { label: 'C', content: 'Elizabeth English' },
            { label: 'D', content: 'Raisa Chowdhury' },
            { label: 'E', content: 'Greg Spotts' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Tol: "approaches that… engage and benefit communities and local decision-makers".',
        },
        {
          number: 24,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. Interventions which reduce heat are absolutely vital for our survival in this location.',
          choices: [
            { label: 'A', content: 'Yanira Pineda' },
            { label: 'B', content: 'Susanna Tol' },
            { label: 'C', content: 'Elizabeth English' },
            { label: 'D', content: 'Raisa Chowdhury' },
            { label: 'E', content: 'Greg Spotts', isCorrect: true },
          ],
          difficulty: 'EASY',
          tags: ['matching-people'],
          explanation: 'Spotts: "Urban cooling is literally a matter of life and death for our future in LA".',
        },
        {
          number: 25,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. More work will need to be done in future decades to deal with the impact of rising water levels.',
          choices: [
            { label: 'A', content: 'Yanira Pineda', isCorrect: true },
            { label: 'B', content: 'Susanna Tol' },
            { label: 'C', content: 'Elizabeth English' },
            { label: 'D', content: 'Raisa Chowdhury' },
            { label: 'E', content: 'Greg Spotts' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Pineda: "in 20, 30, 40 years, we\'ll need to go back in there and adjust".',
        },
        {
          number: 26,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. The number of locations requiring action to adapt to flooding has grown in recent years.',
          choices: [
            { label: 'A', content: 'Yanira Pineda' },
            { label: 'B', content: 'Susanna Tol' },
            { label: 'C', content: 'Elizabeth English', isCorrect: true },
            { label: 'D', content: 'Raisa Chowdhury' },
            { label: 'E', content: 'Greg Spotts' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'English: "this technology is becoming necessary in places that didn\'t previously need it".',
        },
      ],
    },
    {
      title: 'A new role for livestock guard dogs',
      content: `<p><em>Livestock guard dogs, traditionally used to protect farm animals from predators, are now being used to protect the predators themselves.</em></p>
<p><strong>A</strong>&nbsp; For thousands of years, livestock guard dogs worked alongside shepherds to protect their sheep, goats and cattle from predators such as wolves and bears. But in the 19th and 20th centuries, when such predators were largely exterminated, most guard dogs lost their jobs. In recent years, however, as increased efforts have been made to protect wild animals, predators have become more widespread again. As a result, farmers once more need to protect their livestock, and guard dogs are enjoying an unexpected revival.</p>
<p><strong>B</strong>&nbsp; Today there are around 50 breeds of guard dogs on duty in various parts of the world. These dogs are raised from an early age with the animals they will be watching and eventually these animals become the dog's family. The dogs will place themselves between the livestock and any threat, barking loudly. If necessary, they will chase away predators, but often their mere presence is sufficient. 'Their initial training is to make them understand that livestock is going to be their life,' says Dan Macon, a shepherd with three guard dogs. 'A fluffy white puppy is fun to be around, but too much human affection makes it a great dog for guarding the front porch, rather than a great livestock guard dog.'</p>
<p><strong>C</strong>&nbsp; The evidence indicates that guard dogs are highly effective. For example, in Portugal, biologist Silvia Ribeiro has found that more than 90 per cent of the farmers participating in a programme to train and use guard dogs to protect their herds against attack from wolves rate the performance of the dogs as very good or excellent. In a study carried out in Australia by Linda van Bommel and Chris Johnson at the University of Tasmania, more than 65 per cent of herders reported that predation stopped completely after they got the dogs, and almost all the rest saw a decrease in attacks. 'If they are managed and used properly, livestock guard dogs are the most efficient control method that we have in terms of the amount of livestock that they save from predation,' says van Bommel.</p>
<p><strong>D</strong>&nbsp; But today's guard dogs also have a new role — to help preserve the predators. It is hoped that reductions in livestock losses can make farmers more tolerant of predators and less likely to kill them. In Namibia, more than 90 per cent of cheetahs live outside protected areas, close to humans raising livestock. As a result, the cheetahs are often held responsible for animal losses, and large numbers have been killed by farmers. When guard dogs were introduced, more than 90 per cent of farmers reported a dramatic reduction in livestock losses, and said that as a result they were less likely to kill predators. Julie Young, at Utah State University in the US, believes this result applies widely. 'There is common ground from the livestock perspective and from the conservation perspective,' she says. 'If ranchers don't have a dead cow, they will not make a call to apply for a permit to kill a wolf.'</p>
<p><strong>E</strong>&nbsp; Looking at all the published evidence, Bethany Smith at Nottingham Trent University in the UK found that up to 88 per cent of farmers said they no longer killed predators after using dogs — but warned that such self-reported results must be taken with a pinch of salt. What's more, it is possible that livestock guard dogs merely displace predators to unprotected neighbouring properties, where their fate isn't recorded. 'In some regions, we work with almost every farmer, but in others only one or two have dogs,' says Ribeiro. 'If we are not working with everybody, we are transferring the wolf pressure to the neighbour's herd and he can use poison and kill an entire pack of wolves.'</p>
<p><strong>F</strong>&nbsp; Another concern is whether there may be unintended ecological effects of using guard dogs. Studies suggest that reducing deaths of one type of predator may have a negative impact on other species. The extent of this problem isn't known, but the consequences are clear in Namibia. Cheetahs aren't the only species that cause sheep and goat losses there: other predators also attack livestock. In 2015, researchers reported that in spite of the impact farmers obtaining guard dogs had on cheetahs, the number of jackals killed by dogs and people actually increased. Guard dogs have other ecological impacts too. They have been found to spread diseases to wild animals, including endangered Ethiopian wolves. They may also compete with other carnivores for food. And by creating a 'landscape of fear', their mere presence can influence the behaviour of prey animals.</p>
<p><strong>G</strong>&nbsp; The evidence so far, however, indicates that these consequences aren't always negative. Guard dogs can deliver unexpected benefits by protecting vulnerable wildlife from predators. For example, their presence has been found to protect birds which build their nests on the ground in fields, where foxes would normally raid them. Indeed, Australian researchers are now using dogs to enhance biodiversity and create refuges for species threatened by predation. So if we can get this right, there may be a bright future for guard dogs in promoting harmonious coexistence between humans and wildlife.</p>`,
      questions: [
        {
          number: 27,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? An example of how one predator has been protected by the introduction of livestock guard dogs. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D', isCorrect: true },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
            { label: 'G', content: 'Paragraph G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục D: báo cheetah ở Namibia bớt bị nông dân giết sau khi có chó bảo vệ.',
        },
        {
          number: 28,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? An optimistic suggestion about the possible positive developments in the use of livestock guard dogs. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
            { label: 'G', content: 'Paragraph G', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục G: "there may be a bright future for guard dogs in promoting harmonious coexistence".',
        },
        {
          number: 29,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? A description of how the methods used by livestock guard dogs help to keep predators away. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B', isCorrect: true },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
            { label: 'G', content: 'Paragraph G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục B: chó đứng chắn giữa đàn và mối nguy, sủa to, cần thì đuổi.',
        },
        {
          number: 30,
          type: 'SINGLE_CHOICE',
          content: "Which paragraph contains the following information? Claims by different academics that the use of livestock guard dogs is a successful way of protecting farmers' herds. (NB You may use any letter more than once.)",
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B' },
            { label: 'C', content: 'Paragraph C', isCorrect: true },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
            { label: 'G', content: 'Paragraph G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục C dẫn cả Ribeiro (Bồ Đào Nha) lẫn van Bommel & Johnson (Úc).',
        },
        {
          number: 31,
          type: 'SINGLE_CHOICE',
          content: 'Which paragraph contains the following information? A reference to how livestock guard dogs gain their skills. (NB You may use any letter more than once.)',
          choices: [
            { label: 'A', content: 'Paragraph A' },
            { label: 'B', content: 'Paragraph B', isCorrect: true },
            { label: 'C', content: 'Paragraph C' },
            { label: 'D', content: 'Paragraph D' },
            { label: 'E', content: 'Paragraph E' },
            { label: 'F', content: 'Paragraph F' },
            { label: 'G', content: 'Paragraph G' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-information'],
          explanation: 'Mục B: chó được nuôi cùng đàn từ nhỏ, "Their initial training is…".',
        },
        {
          number: 32,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. The use of guard dogs may save the lives of both livestock and wild animals.',
          choices: [
            { label: 'A', content: 'Dan Macon' },
            { label: 'B', content: 'Silvia Ribeiro' },
            { label: 'C', content: 'Linda van Bommel' },
            { label: 'D', content: 'Julie Young', isCorrect: true },
            { label: 'E', content: 'Bethany Smith' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Young: "common ground from the livestock perspective and from the conservation perspective".',
        },
        {
          number: 33,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. Claims of a change in behaviour from those using livestock guard dogs may not be totally accurate.',
          choices: [
            { label: 'A', content: 'Dan Macon' },
            { label: 'B', content: 'Silvia Ribeiro' },
            { label: 'C', content: 'Linda van Bommel' },
            { label: 'D', content: 'Julie Young' },
            { label: 'E', content: 'Bethany Smith', isCorrect: true },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Smith: kết quả nông dân tự khai "must be taken with a pinch of salt".',
        },
        {
          number: 34,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. There may be negative results if the use of livestock guard dogs is not sufficiently widespread.',
          choices: [
            { label: 'A', content: 'Dan Macon' },
            { label: 'B', content: 'Silvia Ribeiro', isCorrect: true },
            { label: 'C', content: 'Linda van Bommel' },
            { label: 'D', content: 'Julie Young' },
            { label: 'E', content: 'Bethany Smith' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Ribeiro: không làm với tất cả thì chỉ đẩy áp lực sói sang đàn hàng xóm.',
        },
        {
          number: 35,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. Livestock guard dogs are the best way of protecting farm animals, as long as the dogs are appropriately handled.',
          choices: [
            { label: 'A', content: 'Dan Macon' },
            { label: 'B', content: 'Silvia Ribeiro' },
            { label: 'C', content: 'Linda van Bommel', isCorrect: true },
            { label: 'D', content: 'Julie Young' },
            { label: 'E', content: 'Bethany Smith' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'van Bommel: "If they are managed and used properly… the most efficient control method that we have".',
        },
        {
          number: 36,
          type: 'SINGLE_CHOICE',
          content: 'Match the statement with the correct person. Teaching a livestock guard dog how to do its work needs a different focus from teaching a house guard dog.',
          choices: [
            { label: 'A', content: 'Dan Macon', isCorrect: true },
            { label: 'B', content: 'Silvia Ribeiro' },
            { label: 'C', content: 'Linda van Bommel' },
            { label: 'D', content: 'Julie Young' },
            { label: 'E', content: 'Bethany Smith' },
          ],
          difficulty: 'MEDIUM',
          tags: ['matching-people'],
          explanation: 'Macon: quá nhiều tình cảm của người thì thành chó giữ hiên nhà, không phải chó giữ đàn.',
        },
        {
          number: 37,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. Unintended ecological effects — in Namibia, the use of guard dogs has led to a rise in the deaths of other predators, particularly ________.',
          correctText: ['jackals', 'jackal'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục F: "the number of jackals killed by dogs and people actually increased".',
        },
        {
          number: 38,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. It has been suggested that the dogs could have ________ which may affect other species.',
          correctText: ['diseases', 'disease'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục F: "They have been found to spread diseases to wild animals".',
        },
        {
          number: 39,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. It has also been suggested that the dogs may reduce the amount of ________ available to certain wild animals.',
          correctText: ['food'],
          difficulty: 'MEDIUM',
          tags: ['summary-completion'],
          explanation: 'Mục F: "They may also compete with other carnivores for food".',
        },
        {
          number: 40,
          type: 'FILL_BLANK',
          content: 'Complete the summary with ONE WORD ONLY from the passage. On the other hand, these dogs may help birds by protecting their nests, which might otherwise be threatened by predators such as ________.',
          correctText: ['foxes', 'fox'],
          difficulty: 'EASY',
          tags: ['summary-completion'],
          explanation: 'Mục G: "where foxes would normally raid them".',
        },
      ],
    },
  ],
}
