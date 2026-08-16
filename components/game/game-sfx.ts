/**
 * Sound effect nhẹ cho các game trong Tiện ích — sinh bằng WebAudio,
 * không cần file âm thanh. Mỗi hàm tự tạo/đóng AudioContext như chime()
 * của Pomodoro: đơn giản, không giữ trạng thái.
 *
 * Trình duyệt chỉ cho phát sau thao tác của người dùng — các hàm này luôn
 * được gọi từ event handler (gõ phím, bấm nút) nên thoả điều kiện.
 */

type Note = { freq: number; at: number; dur: number; vol?: number }

function playNotes(notes: Note[]) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    for (const n of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle' // tròn, mềm hơn sóng sin thuần
      osc.frequency.value = n.freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = now + n.at
      const vol = n.vol ?? 0.16
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur)
      osc.start(t)
      osc.stop(t + n.dur + 0.02)
    }
    const total = notes.reduce((m, n) => Math.max(m, n.at + n.dur), 0)
    setTimeout(() => void ctx.close(), (total + 0.2) * 1000)
  } catch {
    /* trình duyệt chặn audio — im lặng là chấp nhận được */
  }
}

/** Tiếng "tách" ngắn khi nộp một lượt đoán */
export function sfxTick() {
  playNotes([{ freq: 520, at: 0, dur: 0.07, vol: 0.1 }])
}

/** Đoán đúng / thắng ván — hợp âm vui đi lên (C5–E5–G5–C6) */
export function sfxWin() {
  playNotes([
    { freq: 523.25, at: 0, dur: 0.14 },
    { freq: 659.25, at: 0.11, dur: 0.14 },
    { freq: 783.99, at: 0.22, dur: 0.14 },
    { freq: 1046.5, at: 0.33, dur: 0.22 },
  ])
}

/** Đoán sai / thua ván — hai nốt trầm đi xuống */
export function sfxLose() {
  playNotes([
    { freq: 330, at: 0, dur: 0.18, vol: 0.14 },
    { freq: 220, at: 0.16, dur: 0.3, vol: 0.14 },
  ])
}
