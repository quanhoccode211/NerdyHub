'use client'

import { useCallback, useState } from 'react'
import { useLocale } from '../i18n/locale-provider'
import { TasksIcon, XIcon } from '../shell/icons'
import {
  DEFAULT_PREFS,
  INTERVAL_OPTIONS,
  clampInterval,
  isPreset,
  requestTestNudge,
  resetPrefs,
  setPrefs,
  useReminderPrefs,
} from './reminder-prefs'

/**
 * Bảng chỉnh lời nhắc: một mẫu để xem trước, và nhịp nhắc.
 *
 * Mẫu KHÔNG phải hình vẽ mô phỏng — nó dùng đúng class `.todo-nudge` của pill
 * thật (todo-nudge.tsx). Một bản xem trước "gần giống" thì mọi lần sửa pill
 * thật lại phải nhớ sửa cả đây, mà quên một lần là bảng này nói dối.
 */
export function ReminderSettings() {
  const { t } = useLocale()
  const prefs = useReminderPrefs()

  const custom = !isPreset(prefs.intervalMin)
  /** Ô nhập giữ chuỗi riêng để người dùng xoá trắng rồi gõ lại được — ràng
   *  thẳng vào số thì xoá ký tự cuối là nó tự nhảy về `MIN_INTERVAL`. */
  const [draft, setDraft] = useState(String(prefs.intervalMin))

  const chooseCustom = useCallback(() => {
    /* Bấm "Tuỳ chọn" khi đang ở một mốc dựng sẵn: giữ nguyên con số hiện tại
       làm điểm bắt đầu, đừng nhảy về 1 phút. Cộng 1 để nó rời khỏi mốc dựng
       sẵn, nếu không thì nút vừa bấm lại tự bỏ chọn ngay. */
    if (!custom) {
      const next = clampInterval(prefs.intervalMin + 1)
      setDraft(String(next))
      setPrefs({ intervalMin: next })
    }
  }, [custom, prefs.intervalMin])

  const commitDraft = useCallback(
    (raw: string) => {
      setDraft(raw)
      if (raw.trim() === '') return
      setPrefs({ intervalMin: clampInterval(Number(raw)) })
    },
    [],
  )

  const isDefault =
    prefs.enabled === DEFAULT_PREFS.enabled && prefs.intervalMin === DEFAULT_PREFS.intervalMin

  return (
    <section className="panel p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[21px] font-bold">{t('reminder.title')}</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-strong">
            {t('reminder.body')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPrefs({ enabled: !prefs.enabled })}
          aria-pressed={prefs.enabled}
          className="btn-secondary flex-none px-4 py-2 text-[14px]"
        >
          {prefs.enabled ? t('reminder.off') : t('reminder.on')}
        </button>
      </div>

      {/* ---------- MẪU ---------- */}
      {/*
        `aria-hidden` cho cả khối: nội dung là chữ trang trí, mà trình đọc màn
        hình đọc lại câu nhắc ở đây sẽ nghe như một lời nhắc thật vừa hiện ra.
      */}
      <div
        aria-hidden="true"
        className={`todo-nudge mt-5 flex max-w-[340px] items-start gap-2.5 rounded-2xl p-3 shadow-[0_16px_40px_rgba(24,28,45,.18)] ${
          prefs.enabled ? '' : 'opacity-45'
        }`}
      >
        <span className="flex-none pt-0.5">
          <TasksIcon size={15} />
        </span>
        <span className="min-w-0 flex-1 text-[14px] leading-relaxed">{t('reminder.sample')}</span>
        <span className="flex-none pt-0.5 opacity-70">
          <XIcon size={14} />
        </span>
      </div>

      {/* ---------- NHỊP NHẮC ---------- */}
      <fieldset className="mt-6">
        <legend className="text-[14.5px] font-medium">{t('reminder.interval')}</legend>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {INTERVAL_OPTIONS.map((n) => (
            <IntervalButton
              key={n}
              /* Luôn tính bằng PHÚT, kể cả mốc 60. Trước đây mốc này ghi "1
                 tiếng": đọc thì tự nhiên hơn, nhưng đứng cạnh "5 phút / 10 phút
                 / 30 phút" thì nó là đơn vị thứ hai trong cùng một hàng, và mắt
                 phải quy đổi mới so được bốn lựa chọn với nhau. */
              label={`${n} phút`}
              selected={prefs.intervalMin === n}
              onSelect={() => setPrefs({ intervalMin: n })}
            />
          ))}
          <IntervalButton
            label={t('reminder.custom')}
            selected={custom}
            onSelect={chooseCustom}
          />

          {custom && (
            <span className="flex items-center gap-2">
              {/*
                `inputMode="numeric"` chứ không phải `type="number"`: type number
                trên di động vẫn hiện nút tăng/giảm và cho gõ cả "e", "+".
              */}
              <input
                value={draft}
                onChange={(e) => commitDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onBlur={() => setDraft(String(prefs.intervalMin))}
                inputMode="numeric"
                aria-label={t('reminder.customLabel')}
                className="w-[72px] rounded-pill border border-line bg-card px-3 py-2 text-center text-[14px] outline-none focus-visible:border-line-strong"
              />
              <span className="text-[14px] text-muted-strong">{t('reminder.minutes')}</span>
            </span>
          )}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {/* Hiện pill NGAY, kể cả khi lời nhắc đang tắt — xem `onTestNudge`. */}
        <button type="button" onClick={requestTestNudge} className="btn-primary px-4 py-2 text-[14px]">
          {t('reminder.test')}
        </button>
        <button
          type="button"
          onClick={() => {
            resetPrefs()
            setDraft(String(DEFAULT_PREFS.intervalMin))
          }}
          disabled={isDefault}
          className="text-[14px] text-muted underline underline-offset-2 hover:text-ink disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
        >
          {t('reminder.reset')}
        </button>
        <span className="text-[13.5px] text-muted">{t('reminder.saved')}</span>
      </div>
    </section>
  )
}

/**
 * Nút chọn mốc thời gian. CHỮ ĐEN, nền sáng, ở cả hai trạng thái.
 *
 * Bản trước tô nút đang chọn bằng đúng màu xanh của pill nhắc, và đó là sai:
 * hai thứ khác hẳn nhau về vai trò lại mang cùng một màu, nên màu thôi không
 * còn chỉ ra được cái gì. Màu xanh giờ chỉ thuộc về pill. Ở đây trạng thái
 * chọn nói bằng VIỀN ĐẬM và chữ in đậm — đủ để phân biệt mà không cần thêm
 * một màu nào nữa.
 */
function IntervalButton({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-pill border px-4 py-2 text-[14px] transition-colors ${
        selected
          ? 'border-ink bg-soft font-bold text-ink'
          : 'border-line bg-card text-ink hover:border-line-strong'
      }`}
    >
      {label}
    </button>
  )
}
