/**
 * Câu chơi chữ hiển thị to ở trang chủ.
 *
 * ĐỔI MỖI LẦN VÀO TRANG, không phải mỗi ngày. Bản trước index theo số thứ tự
 * ngày trong năm để cùng một ngày ai cũng thấy cùng một câu — hợp với trang
 * dựng sẵn. Nay yêu cầu là random từng lượt, nên cách chọn đổi theo, và kéo
 * theo một thay đổi BẮT BUỘC ở phía trang: xem `dynamic` trong
 * app/(landing)/page.tsx. Random trên một trang còn cache thì vô nghĩa — mọi
 * khách trong cùng khoảng cache vẫn nhận đúng một câu đã bốc sẵn lúc dựng.
 *
 * Thêm câu mới chỉ cần nối vào mảng này, không phải sửa gì ở trang chủ.
 */

export type Pun = {
  /** Dòng trên — phần dẫn */
  setup: string
  /** Dòng dưới — phần chốt */
  punchline: string
}

/**
 * Tách làm hai dòng vì trang chủ dựng mỗi dòng một `<span>` riêng, và hai dòng
 * đó nảy lên lệch nhau (`--pop-i` 1 và 2). Gộp thành một chuỗi là mất phần
 * chốt rơi xuống sau — thứ làm nên nhịp của câu đùa.
 */
export const PUNS: Pun[] = [
  { setup: 'Why did the plant go to therapy?', punchline: 'It had deep-rooted issues.' },
  {
    setup: 'Parallel lines have so much in common.',
    punchline: 'It’s a shame they’ll never meet.',
  },
  {
    setup: 'The past, present, and future walked into a bar.',
    punchline: 'It was tense.',
  },
  {
    setup: 'Why did the biologist break up with the physicist?',
    punchline: 'They had no chemistry.',
  },
  { setup: 'Never trust an atom.', punchline: 'They make up everything.' },
  {
    setup: 'Did you hear oxygen went on a date with potassium?',
    punchline: 'It went OK.',
  },
  { setup: 'What did the zero say to the eight?', punchline: 'Nice belt.' },
  {
    setup: 'Did you hear about the overeducated circle?',
    punchline: 'It has 360 degrees.',
  },
  {
    setup: 'Why do programmers prefer dark mode?',
    punchline: 'Because light attracts bugs.',
  },
  {
    setup: 'How many programmers does it take to change a light bulb?',
    punchline: 'None, that’s a hardware problem.',
  },
  { setup: 'Not all math puns are terrible.', punchline: 'Just sum.' },
  {
    setup: 'I had an argument with a 90° angle.',
    punchline: 'It turns out it was right.',
  },
]

/**
 * Bốc ngẫu nhiên một câu.
 *
 * `Math.random()` là đủ và cố ý: đây là chuyện thẩm mỹ, không phải bốc thăm hay
 * mã hoá, nên không cần `crypto.getRandomValues`.
 *
 * KHÔNG nhớ câu vừa ra. Nghĩa là hai lượt liên tiếp có thể trùng nhau — với 12
 * câu thì xác suất trùng ngay lượt sau là 1/12. Muốn chắc chắn không lặp lại
 * thì phải giữ trạng thái giữa các request, mà trạng thái đó không sống nổi
 * trên serverless (mỗi lượt gọi có thể là một máy khác).
 */
export function randomPun(): Pun {
  return PUNS[Math.floor(Math.random() * PUNS.length)]
}
