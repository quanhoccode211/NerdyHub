'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { ExamProgress } from '@/lib/dashboard'
import { LANGUAGE_FLAGS, type Language } from '@/lib/enums'
import { CardHeader } from '../shell/app-shell'
import {
  BookIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DotsIcon,
  PlayIcon,
  TargetIcon,
} from '../shell/icons'

/**
 * "Tiến độ luyện đề" — khối Ongoing Class của ảnh tham chiếu.
 * Mỗi thẻ là một kỳ thi: gradient riêng, tag, thanh tiến độ, % hoàn thành.
 */

/**
 * Màu nằm ở CSS variable (globals.css) chứ không viết thẳng vào đây.
 * Nền pastel luôn sáng nên chữ trên thẻ dùng `text-on-tone`.
 */
const TONES = [
  { bg: 'var(--tile-mint)', chip: 'var(--tile-chip)', track: 'var(--tile-track)' },
  { bg: 'var(--tile-peri)', chip: 'var(--tile-chip)', track: 'var(--tile-track)' },
  { bg: 'var(--tile-sky)', chip: 'var(--tile-chip)', track: 'var(--tile-track)' },
  { bg: 'var(--tile-sand)', chip: 'var(--tile-chip)', track: 'var(--tile-track)' },
] as const

const LANG_LABEL: Record<string, string> = {
  EN: 'Tiếng Anh',
  KO: 'Tiếng Hàn',
  JA: 'Tiếng Nhật',
  ZH: 'Tiếng Trung',
  DE: 'Tiếng Đức',
  VI: 'Tiếng Việt',
}

export function TestProgress({ exams }: { exams: ExamProgress[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  function onScroll() {
    const el = scroller.current
    if (!el) return
    setAtStart(el.scrollLeft < 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }

  function scrollBy(dir: -1 | 1) {
    scroller.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  const remaining = exams.reduce((s, e) => s + Math.max(0, e.totalPapers - e.donePapers), 0)

  return (
    <section className="card p-5 md:p-6">
      <CardHeader
        icon={<TargetIcon size={17} />}
        title="Tiến độ luyện đề"
        meta={
          remaining > 0 ? (
            <span className="pill bg-accent text-[var(--color-accent-fg)]">+{remaining} đề</span>
          ) : null
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              className="icon-circle disabled:opacity-35"
              aria-label="Xem thẻ trước"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              className="icon-circle disabled:opacity-35"
              aria-label="Xem thẻ sau"
            >
              <ChevronRightIcon size={16} />
            </button>
            <button type="button" className="icon-circle" aria-label="Tuỳ chọn khác">
              <DotsIcon size={16} />
            </button>
          </>
        }
      />

      {exams.length === 0 ? (
        <p className="panel p-8 text-center text-[15px] text-muted">
          Chưa có kỳ thi nào được công bố.
        </p>
      ) : (
        <div
          ref={scroller}
          onScroll={onScroll}
          /*
            `no-scrollbar`, KHÔNG phải `thin-scroll`: giấu thanh cuộn đi nhưng
            vẫn cuộn được y như cũ — lăn chuột, vuốt trên cảm ứng, phím mũi tên
            đều nguyên vẹn, chỉ có cái vạch xám là mất.

            Ở ĐÂY thì giấu được, chỗ khác thì không. Hàng này đã có hai nút mũi
            tên ở góc thẻ, và chúng tự tắt khi chạm hai đầu (`atStart` /
            `atEnd`) — tức lối đi và cả dấu hiệu "còn thẻ nữa ở ngoài rìa" đều
            đã nằm sẵn trong giao diện, thanh cuộn chỉ nói lại lần thứ hai.
            Những chỗ `thin-scroll` còn lại (hộp thoại điều khoản, phòng thi)
            không có nút nào thay thế nên thanh cuộn ở đó là dấu hiệu DUY NHẤT,
            đừng bê cách này sang.
          */
          className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1"
        >
          {exams.map((exam, i) => {
            const tone = TONES[i % TONES.length]
            const started = exam.donePapers > 0 || exam.inProgressAttemptId !== null

            return (
              <article
                key={exam.examId}
                className="flex min-w-[248px] flex-1 snap-start flex-col rounded-tile p-5 text-on-tone"
                style={{ background: tone.bg }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[14px] text-on-tone"
                    style={{ background: tone.chip }}
                  >
                    <BookIcon size={20} />
                  </span>
                  <button
                    type="button"
                    className="rounded-full p-1 text-on-tone/45 hover:text-on-tone/70"
                    aria-label={`Tuỳ chọn cho ${exam.name}`}
                  >
                    <DotsIcon size={16} />
                  </button>
                </div>

                <h3 className="mt-4 text-[20px] leading-tight font-bold">
                  {exam.name} <span aria-hidden="true">{LANGUAGE_FLAGS[exam.language as Language]}</span>
                </h3>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span
                    className="pill text-[12.5px] text-on-tone/75"
                    style={{ background: tone.chip }}
                  >
                    {LANG_LABEL[exam.language] ?? exam.language}
                  </span>
                  <span
                    className="pill text-[12.5px] text-on-tone/75"
                    style={{ background: tone.chip }}
                  >
                    {exam.totalPapers} đề
                  </span>
                  {exam.avgScorePercent !== null && (
                    <span
                      className="pill text-[12.5px] text-on-tone/75"
                      style={{ background: tone.chip }}
                    >
                      TB {Math.round(exam.avgScorePercent)}%
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <div
                    className="h-2 overflow-hidden rounded-pill"
                    style={{ background: tone.track }}
                  >
                    <div
                      className="h-full rounded-pill bg-white transition-[width] duration-500"
                      style={{ width: `${Math.max(exam.percent, 3)}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[14px]">
                    <span className="font-medium text-on-tone/70">
                      {exam.donePapers}/{exam.totalPapers} đề
                    </span>
                    <span className="font-bold">{exam.percent}%</span>
                  </div>

                  <Link
                    href={
                      exam.inProgressAttemptId
                        ? `/thi/${exam.inProgressAttemptId}`
                        : `/de-thi/${exam.slug}`
                    }
                    className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-pill bg-accent py-2.5 text-[14px] font-semibold text-[var(--color-accent-fg)] transition-opacity hover:opacity-88"
                  >
                    <PlayIcon size={12} />
                    {exam.inProgressAttemptId
                      ? 'Làm tiếp bài dở'
                      : started
                        ? 'Làm đề tiếp theo'
                        : 'Bắt đầu'}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
