/**
 * Sinh file WAV placeholder cho các section Listening.
 *
 * Không có bản ghi thật trong repo dev, nhưng phòng thi cần audio CÓ ĐỘ DÀI THẬT
 * để kiểm chứng hành vi ONCE_NO_SEEK (phát một lần, không tua, không phát lại).
 * Mỗi file phát một chuỗi tone cách nhau 3 giây để nghe được tiến độ.
 *
 * Chạy: node scripts/make-placeholder-audio.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SAMPLE_RATE = 8000
const BITS = 16
const OUT_DIR = path.join(process.cwd(), 'public', 'audio')

const FILES = [
  { name: 'vstep-listening-part1.wav', seconds: 40, baseHz: 440 },
  { name: 'topik-listening-part1.wav', seconds: 36, baseHz: 523 },
  { name: 'thpt-listening-part1.wav', seconds: 32, baseHz: 392 },
]

function buildWav(seconds, baseHz) {
  const totalSamples = SAMPLE_RATE * seconds
  const dataSize = totalSamples * (BITS / 8)
  const buffer = Buffer.alloc(44 + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // PCM chunk size
  buffer.writeUInt16LE(1, 20) // format = PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * (BITS / 8), 28) // byte rate
  buffer.writeUInt16LE(BITS / 8, 32) // block align
  buffer.writeUInt16LE(BITS, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE
    // Một tone 0.35s ở đầu mỗi chu kỳ 3 giây, cao dần theo số thứ tự
    const cycle = Math.floor(t / 3)
    const withinCycle = t % 3
    let amplitude = 0
    if (withinCycle < 0.35) {
      const freq = baseHz * (1 + (cycle % 4) * 0.12)
      // fade in/out để không bị pop
      const envelope = Math.sin((withinCycle / 0.35) * Math.PI)
      amplitude = Math.sin(2 * Math.PI * freq * t) * envelope * 0.28
    }
    buffer.writeInt16LE(Math.round(amplitude * 32767), 44 + i * 2)
  }
  return buffer
}

mkdirSync(OUT_DIR, { recursive: true })
for (const f of FILES) {
  const wav = buildWav(f.seconds, f.baseHz)
  writeFileSync(path.join(OUT_DIR, f.name), wav)
  console.log(`✓ ${f.name} — ${f.seconds}s, ${(wav.length / 1024).toFixed(0)} KB`)
}
