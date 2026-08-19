'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { ExamProgress } from '@/lib/dashboard'
import { LANGUAGE_FLAGS, languageStripe, type Language } from '@/lib/enums'
import { CardHeader } from '../shell/app-shell'
import { vi as MESSAGES_VI, type MessageKey } from '@/lib/i18n/messages'
import { useLocale } from '../i18n/locale-provider'
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

/* Nhãn ngôn ngữ giờ nằm trong từ điển (`lang.*`) — xem hàm dịch bên dưới. */

export function TestProgress({ exams }: { exams: ExamProgress[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const { t } = useLocale()

  /* Mã ngôn ngữ tới từ database nên có thể là mã lạ; rơi về chính mã đó thay vì
     để trống. Danh sách khoá hợp lệ xem LANGUAGES trong lib/enums.ts. */
  const langLabel = (code: string) => {
    const key = `lang.${code}` as MessageKey
    return key in MESSAGES_VI ? t(key) : code
  }

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
        title={t('progress.title')}
        meta={
          remaining > 0 ? (
            <span className="pill bg-accent text-[var(--color-accent-fg)]">{t('progress.remaining', { count: remaining })}</span>
          ) : null
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              className="icon-circle disabled:opacity-35"
              aria-label={t('progress.prev')}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              className="icon-circle disabled:opacity-35"
              aria-label={t('progress.next')}
            >
              <ChevronRightIcon size={16} />
            </button>
            <button type="button" className="icon-circle" aria-label={t('widget.moreOptions')}>
              <DotsIcon size={16} />
            </button>
          </>
        }
      />

      {exams.length === 0 ? (
        <p className="panel p-8 text-center text-[15px] text-muted">
          {t('progress.empty')}
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
          {exams.map((exam) => {
            const started = exam.donePapers > 0 || exam.inProgressAttemptId !== null

            return (
              /*
                Thẻ TRẮNG + dải màu ngôn ngữ, cùng công thức với thẻ ở /de-thi —
                khác mỗi chỗ dải nằm trên ĐỈNH thay vì cạnh trái.

                Bỏ nền pastel vì nó đổi theo THỨ TỰ thẻ trong hàng (`TONES[i]`):
                cùng một kỳ thi mang màu khác nhau tuỳ nó đứng thứ mấy, nên màu
                không nói lên điều gì. Dải màu bám theo NGÔN NGỮ nên VSTEP ở đâu
                cũng là dải Anh, giống hệt bên kho đề.

                `overflow-hidden` để dải bị cắt theo góc bo; thiếu nó thì dải chạy
                thẳng ra ngoài và đâm thủng hai góc trên.
              */
              <article
                key={exam.examId}
                className="card relative flex min-w-[248px] flex-1 snap-start flex-col overflow-hidden px-5 pt-7 pb-5"
              >
                {/* 90deg: băng màu xếp cạnh nhau theo chiều ngang. Dải dọc bên
                    /de-thi dùng mặc định 180deg — xem languageStripe(). */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[6px]"
                  style={{ backgroundImage: languageStripe(exam.language as Language, 90) }}
                />

                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-soft text-muted-strong">
                    <BookIcon size={20} />
                  </span>
                  <button
                    type="button"
                    className="rounded-full p-1 text-muted hover:text-muted-strong"
                    aria-label={t('progress.optionsFor', { name: exam.name })}
                  >
                    <DotsIcon size={16} />
                  </button>
                </div>

                <h3 className="mt-4 text-[20px] leading-tight font-bold">
                  {exam.name} <span aria-hidden="true">{LANGUAGE_FLAGS[exam.language as Language]}</span>
                </h3>

                {/* Số đề đã nằm ở dòng "0/1 đề" ngay dưới thanh tiến độ — một ô
                    pill nhắc lại lần nữa là thừa. */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="pill bg-soft text-[12.5px] text-muted-strong">
                    {langLabel(exam.language)}
                  </span>
                  {exam.avgScorePercent !== null && (
                    <span className="pill bg-soft text-[12.5px] text-muted-strong">
                      {t('progress.avg', { percent: Math.round(exam.avgScorePercent) })}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <div className="h-2 overflow-hidden rounded-pill bg-soft">
                    <div
                      className="h-full rounded-pill bg-accent transition-[width] duration-500"
                      style={{ width: `${Math.max(exam.percent, 3)}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[14px]">
                    <span className="font-medium text-muted-strong">
                      {t('progress.doneOf', { done: exam.donePapers, total: exam.totalPapers })}
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
