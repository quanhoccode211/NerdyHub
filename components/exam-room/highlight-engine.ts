'use client'

import type { RoomAnnotation } from '@/lib/attempt-service'

/**
 * Highlight & ghi chú trên passage (SPEC F2.4).
 *
 * Neo theo offset ký tự trên `textContent` của container, KHÔNG theo cấu trúc DOM.
 * Lý do: thẻ <mark> được chèn/gỡ liên tục làm cây DOM đổi hình, nhưng tổng text
 * không đổi — nên offset vẫn trỏ đúng chỗ sau reload và sau khi nộp bài.
 */

const MARK_SELECTOR = 'mark[data-hl]'

function textNodesOf(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let n = walker.nextNode()
  while (n) {
    nodes.push(n as Text)
    n = walker.nextNode()
  }
  return nodes
}

/** Gỡ toàn bộ <mark> đã chèn, trả DOM về trạng thái sạch. */
export function clearHighlights(root: HTMLElement) {
  const marks = root.querySelectorAll(MARK_SELECTOR)
  for (const mark of marks) {
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
  }
  root.normalize() // gộp lại text node bị tách, giữ offset ổn định
}

/** Offset ký tự của một vị trí (node, offset) so với đầu container. */
export function positionToOffset(root: HTMLElement, node: Node, offset: number): number | null {
  const nodes = textNodesOf(root)
  let total = 0
  for (const n of nodes) {
    if (n === node) return total + offset
    total += n.data.length
  }
  // Con trỏ nằm trên element chứ không phải text node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element
    const child = el.childNodes[offset]
    if (child) {
      let acc = 0
      for (const n of nodes) {
        if (child.contains(n) || child === n) return acc
        acc += n.data.length
      }
    }
  }
  return null
}

/** Lấy vùng chọn hiện tại dưới dạng offset, null nếu không hợp lệ. */
export function getSelectionOffsets(
  root: HTMLElement,
): { start: number; end: number; text: string } | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null

  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null

  const start = positionToOffset(root, range.startContainer, range.startOffset)
  const end = positionToOffset(root, range.endContainer, range.endOffset)
  if (start === null || end === null || start === end) return null

  const text = sel.toString()
  if (!text.trim()) return null

  return { start: Math.min(start, end), end: Math.max(start, end), text }
}

/** Toạ độ để đặt popup, tính theo viewport. */
export function getSelectionRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const rect = sel.getRangeAt(0).getBoundingClientRect()
  return rect.width === 0 && rect.height === 0 ? null : rect
}

/**
 * Vẽ một highlight lên DOM.
 * Vùng chọn có thể cắt ngang nhiều thẻ, nên bọc <mark> theo TỪNG text node
 * thay vì Range.surroundContents (hàm đó ném lỗi khi range không cân bằng).
 */
function paintOne(root: HTMLElement, ann: RoomAnnotation) {
  if (ann.startOffset === null || ann.endOffset === null) return
  const { startOffset: start, endOffset: end } = ann

  const nodes = textNodesOf(root)
  let cursor = 0
  const targets: { node: Text; from: number; to: number }[] = []

  for (const node of nodes) {
    const len = node.data.length
    const nodeStart = cursor
    const nodeEnd = cursor + len
    cursor = nodeEnd

    if (nodeEnd <= start || nodeStart >= end) continue
    targets.push({
      node,
      from: Math.max(0, start - nodeStart),
      to: Math.min(len, end - nodeStart),
    })
  }

  for (const t of targets) {
    if (t.to <= t.from) continue
    const range = document.createRange()
    range.setStart(t.node, t.from)
    range.setEnd(t.node, t.to)

    const mark = document.createElement('mark')
    mark.setAttribute('data-hl', ann.color ?? 'yellow')
    mark.setAttribute('data-ann-id', ann.id)
    if (ann.type === 'NOTE' && ann.noteContent) {
      mark.setAttribute('data-has-note', 'true')
      mark.setAttribute('title', ann.noteContent)
    }
    try {
      range.surroundContents(mark)
    } catch {
      // Range không bọc được (hiếm) — bỏ qua đoạn này, không làm hỏng cả trang
    }
  }
}

/**
 * Vẽ lại toàn bộ highlight của một passage.
 * Luôn clear rồi vẽ lại: rẻ hơn nhiều so với đồng bộ từng phần, và tránh
 * lệch offset tích luỹ.
 */
export function paintHighlights(root: HTMLElement, annotations: RoomAnnotation[]) {
  clearHighlights(root)
  // Vẽ từ cuối về đầu để offset của các vùng chưa vẽ không bị thẻ mới chèn làm lệch
  const sorted = [...annotations]
    .filter((a) => a.startOffset !== null && a.endOffset !== null)
    .sort((a, b) => (b.startOffset ?? 0) - (a.startOffset ?? 0))
  for (const ann of sorted) paintOne(root, ann)
}

export function generateAnnotationId(): string {
  // id sinh ở client để lần gửi lại không tạo bản ghi trùng (sync idempotent)
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `ann-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
