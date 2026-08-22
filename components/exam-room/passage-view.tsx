'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RoomAnnotation, RoomPassage } from '@/lib/attempt-service'
import type { HighlightColor } from '@/lib/enums'
import { NoteIcon, XIcon } from '../shell/icons'
import {
  generateAnnotationId,
  getSelectionOffsets,
  getSelectionRect,
  paintHighlights,
} from './highlight-engine'
import { useExamStore } from './store'
// @ts-expect-error KaTeX lacks type defs for mjs contrib
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs'
import 'katex/dist/katex.min.css'

const COLORS: { key: HighlightColor; className: string; label: string }[] = [
  { key: 'yellow', className: 'bg-hl-yellow', label: 'Vàng' },
  { key: 'green', className: 'bg-hl-green', label: 'Xanh lá' },
  { key: 'blue', className: 'bg-hl-blue', label: 'Xanh dương' },
  { key: 'pink', className: 'bg-hl-pink', label: 'Hồng' },
]

type Popup =
  | { kind: 'create'; start: number; end: number; text: string; x: number; y: number }
  | { kind: 'edit'; id: string; x: number; y: number }
  | null

/**
 * Passage kèm highlight + ghi chú (SPEC F2.4).
 * Hoạt động cả trên mobile: long-press chọn text -> `selectionchange` bắn -> popup hiện.
 */
export function PassageView({
  passage,
  readOnly = false,
}: {
  passage: RoomPassage
  readOnly?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [popup, setPopup] = useState<Popup>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const annotations = useExamStore((s) => s.annotations)
  const addAnnotation = useExamStore((s) => s.addAnnotation)
  const updateAnnotation = useExamStore((s) => s.updateAnnotation)
  const removeAnnotation = useExamStore((s) => s.removeAnnotation)

  const mine = Object.values(annotations).filter(
    (a) => a.targetType === 'passage' && a.targetId === passage.id,
  )
  // Khoá phụ thuộc ổn định: chỉ vẽ lại khi highlight thực sự đổi
  const paintKey = mine
    .map((a) => `${a.id}:${a.startOffset}:${a.endOffset}:${a.color}:${a.noteContent ? 1 : 0}`)
    .sort()
    .join('|')

  // Render toán học (KaTeX) TRƯỚC khi paintHighlights chạy
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false,
    })
  }, [passage.content])

  // Vẽ lại highlight sau mỗi lần nội dung hoặc annotation đổi
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    paintHighlights(root, mine)
    // mine được tái tạo mỗi render; paintKey mới là tín hiệu thay đổi thật
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintKey, passage.content])

  const openCreatePopup = useCallback(() => {
    if (readOnly) return
    const root = containerRef.current
    if (!root) return

    const offsets = getSelectionOffsets(root)
    if (!offsets) return
    const rect = getSelectionRect()
    if (!rect) return

    setPopup({
      kind: 'create',
      start: offsets.start,
      end: offsets.end,
      text: offsets.text,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }, [readOnly])

  // Chuột và cảm ứng đều đi qua đây
  useEffect(() => {
    if (readOnly) return
    const onUp = () => {
      // Đợi selection ổn định (Safari/iOS cập nhật sau sự kiện)
      setTimeout(openCreatePopup, 10)
    }
    const root = containerRef.current
    root?.addEventListener('mouseup', onUp)
    root?.addEventListener('touchend', onUp)
    return () => {
      root?.removeEventListener('mouseup', onUp)
      root?.removeEventListener('touchend', onUp)
    }
  }, [openCreatePopup, readOnly])

  // Click vào highlight có sẵn -> mở popup sửa/xoá
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const mark = target.closest('mark[data-ann-id]')
      if (!mark) return
      const id = mark.getAttribute('data-ann-id')
      if (!id) return
      const rect = mark.getBoundingClientRect()
      const existing = useExamStore.getState().annotations[id]
      setNoteDraft(existing?.noteContent ?? '')
      setPopup({ kind: 'edit', id, x: rect.left + rect.width / 2, y: rect.top })
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [])

  // Đóng popup khi bấm ra ngoài
  useEffect(() => {
    if (!popup) return
    const onDocClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('[data-hl-popup]') || el.closest('mark[data-ann-id]')) return
      setPopup(null)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopup(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [popup])

  function createAnnotation(color: HighlightColor, asNote: boolean) {
    if (popup?.kind !== 'create') return
    const ann: RoomAnnotation = {
      id: generateAnnotationId(),
      targetType: 'passage',
      targetId: passage.id,
      type: asNote ? 'NOTE' : 'HIGHLIGHT',
      startOffset: popup.start,
      endOffset: popup.end,
      selectedText: popup.text.slice(0, 500),
      color,
      noteContent: null,
    }
    addAnnotation(ann)
    window.getSelection()?.removeAllRanges()
    if (asNote) {
      setNoteDraft('')
      setPopup({ kind: 'edit', id: ann.id, x: popup.x, y: popup.y })
    } else {
      setPopup(null)
    }
  }

  const editing = popup?.kind === 'edit' ? annotations[popup.id] : undefined

  return (
    <div className="relative">
      {passage.title && <h2 className="mb-3 text-[20px] font-semibold">{passage.title}</h2>}

      {!readOnly && (
        <p className="mb-3 text-[13.5px] text-muted">
          Bôi đen đoạn văn để tô sáng hoặc ghi chú. Bấm vào phần đã tô để sửa hoặc gỡ.
        </p>
      )}

      <div
        ref={containerRef}
        className="passage-body text-[16.5px] leading-relaxed text-ink selection:bg-purple-soft"
        // Nội dung đã sanitize từ lúc GHI vào DB (lib/sanitize-html.ts,
        // scripts/sanitize-passages.ts) — không lọc lại ở đường đọc.
         
        dangerouslySetInnerHTML={{ __html: passage.content }}
      />

      {/* Popup chọn màu / tạo ghi chú */}
      {popup?.kind === 'create' && (
        <div
          data-hl-popup
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-pill bg-ink px-2.5 py-2 shadow-lg"
          style={{ left: popup.x, top: popup.y - 8 }}
        >
          {COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => createAnnotation(c.key, false)}
              aria-label={`Tô màu ${c.label}`}
              className={`h-6 w-6 rounded-full ring-2 ring-white/25 transition-transform hover:scale-110 ${c.className}`}
            />
          ))}
          <span className="mx-1 h-5 w-px bg-white/20" aria-hidden="true" />
          <button
            type="button"
            onClick={() => createAnnotation('yellow', true)}
            className="flex items-center gap-1.5 rounded-pill px-2 py-1 text-[13.5px] font-medium text-white hover:bg-white/10"
          >
            <NoteIcon size={14} />
            Ghi chú
          </button>
        </div>
      )}

      {/* Popup sửa highlight / soạn ghi chú */}
      {popup?.kind === 'edit' && editing && (
        <div
          data-hl-popup
          className="fixed z-50 w-[280px] -translate-x-1/2 -translate-y-full rounded-2xl bg-card p-4 shadow-xl ring-1 ring-line"
          style={{ left: popup.x, top: popup.y - 8 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold">Ghi chú</span>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="rounded-lg p-1 text-muted hover:bg-soft"
              aria-label="Đóng"
            >
              <XIcon size={14} />
            </button>
          </div>

          {!readOnly && (
            <div className="mt-2.5 flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => updateAnnotation(editing.id, { color: c.key })}
                  aria-label={`Đổi sang màu ${c.label}`}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${c.className} ${
                    editing.color === c.key ? 'ring-2 ring-ink ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
          )}

          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() =>
              updateAnnotation(editing.id, {
                noteContent: noteDraft.trim() || null,
                type: noteDraft.trim() ? 'NOTE' : 'HIGHLIGHT',
              })
            }
            readOnly={readOnly}
            placeholder="Ghi chú của bạn…"
            rows={3}
            className="mt-2.5 w-full resize-none rounded-xl bg-soft p-2.5 text-[14.5px] outline-none placeholder:text-muted"
          />

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                removeAnnotation(editing.id)
                setPopup(null)
              }}
              className="mt-2 w-full rounded-pill py-1.5 text-[13.5px] font-medium text-red hover:bg-red-soft"
            >
              Gỡ đánh dấu
            </button>
          )}
        </div>
      )}
    </div>
  )
}
