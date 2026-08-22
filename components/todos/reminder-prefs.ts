'use client'

import { useSyncExternalStore } from 'react'

/**
 * Tuỳ chọn của pill nhắc mục tiêu: bật/tắt và nhịp nhắc.
 *
 * Ở localStorage chứ không phải database, và đó là chủ ý: đây là tuỳ chọn giao
 * diện của MÁY NÀY, không phải một thuộc tính của tài khoản.
 *
 * Từng có thêm `width` cho phép kéo giãn pill — đã bỏ theo yêu cầu chủ dự án.
 * Bản ghi cũ trong localStorage vẫn còn trường đó; `read()` bỏ qua mọi trường
 * lạ nên không cần dọn.
 */

/** Bốn mốc dựng sẵn. Ngoài bốn mốc này là "Tuỳ chọn" — xem `isPreset`. */
export const INTERVAL_OPTIONS = [5, 10, 30, 60] as const

/**
 * Biên của mốc tự nhập. Dưới 1 phút thì `setTimeout` bắn liên tục và pill nhấp
 * nháy không dứt; trên 1440 phút (24 giờ) thì hẹn giờ dài hơn cả một phiên làm
 * việc, tab đóng trước khi tới lượt nên nó chỉ là một cách tắt vòng vo.
 */
export const MIN_INTERVAL = 1
export const MAX_INTERVAL = 1440

export type ReminderPrefs = {
  enabled: boolean
  intervalMin: number
}

export const DEFAULT_PREFS: ReminderPrefs = { enabled: true, intervalMin: 30 }

const KEY = 'todo-nudge-prefs'

export function isPreset(n: number): boolean {
  return (INTERVAL_OPTIONS as readonly number[]).includes(n)
}

export function clampInterval(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_PREFS.intervalMin
  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Math.round(n)))
}

function read(): ReminderPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<ReminderPrefs>
    /*
      Kiểm từng trường chứ không tin cả object: đây là dữ liệu người dùng sửa
      được bằng devtools, và một `intervalMin: 0` lọt qua sẽ thành `setTimeout`
      0ms lặp vô tận — treo hẳn tab.
    */
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULT_PREFS.enabled,
      intervalMin: clampInterval(Number(p.intervalMin)),
    }
  } catch {
    return DEFAULT_PREFS
  }
}

/* Cùng khuôn với todo-store: ảnh chụp bất biến + một hằng riêng cho lượt render
   ở server, vì `useSyncExternalStore` so sánh bằng `Object.is`. */
let snapshot: ReminderPrefs = DEFAULT_PREFS
const SERVER_SNAPSHOT: ReminderPrefs = DEFAULT_PREFS
let hydrated = false
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  /* Nạp ở lần đăng ký ĐẦU TIÊN, không phải lúc import module: đọc localStorage
     ngay khi import thì nó chạy cả trong lượt render của server. */
  if (!hydrated) {
    hydrated = true
    snapshot = read()
  }
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function setPrefs(patch: Partial<ReminderPrefs>) {
  const next: ReminderPrefs = { ...snapshot, ...patch }
  if (patch.intervalMin !== undefined) next.intervalMin = clampInterval(patch.intervalMin)
  snapshot = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* riêng tư / hết quota — tuỳ chọn chỉ sống trong phiên này, không đáng hỏng */
  }
  listeners.forEach((fn) => fn())
}

export function resetPrefs() {
  setPrefs(DEFAULT_PREFS)
}

export function useReminderPrefs(): ReminderPrefs {
  return useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT)
}

// ------------------------------------------------------------ nút "Thử ngay"

/*
  Kênh một chiều từ bảng Cài đặt sang pill nhắc.

  Đặt ở ĐÂY chứ không ở todo-nudge.tsx: bảng Cài đặt vốn đã import module này,
  còn import ngược từ bảng sang pill thì hai file quay vòng vào nhau. Là một
  hàm gọi thẳng chứ không phải `CustomEvent` trên `window`: cả hai đầu nằm
  trong cùng một bó JavaScript, không cần đi vòng qua DOM để nói chuyện.
*/
const testListeners = new Set<() => void>()

/** Bảng Cài đặt gọi — pill hiện ra ngay, không chờ hết nhịp. */
export function requestTestNudge() {
  testListeners.forEach((fn) => fn())
}

/** Pill đăng ký nhận. Trả về hàm huỷ đăng ký. */
export function onTestNudge(fn: () => void) {
  testListeners.add(fn)
  return () => {
    testListeners.delete(fn)
  }
}
