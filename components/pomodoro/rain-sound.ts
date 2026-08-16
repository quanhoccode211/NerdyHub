'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tiếng mưa cho Pomodoro — bản ghi THẬT, lặp vô hạn.
 *
 * Nguồn: "Rain Sound" của boons_freak (Pixabay, ID 188158) — 91 giây,
 * mp3 stereo 256kbps. File: public/audio/rain-loop.mp3 (2,9MB).
 * Không ưng bản này thì thay file tại chỗ — tên giữ nguyên là chạy.
 *
 * Chính sách autoplay: trình duyệt chỉ cho phát sau thao tác của người dùng
 * nên trạng thái BẬT không khôi phục lại khi tải lại trang — chỉ âm lượng
 * được ghi nhớ.
 */

const VOL_KEY = 'pomodoro-rain-vol'
/** Bản ghi to hơn nhạc nền — khuếch nhẹ thôi */
const GAIN = 0.9

export function useRainSound() {
  const [on, setOn] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /* Nạp âm lượng đã lưu sau mount — localStorage không có ở server */
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(VOL_KEY))
      if (Number.isFinite(v) && v >= 0 && v <= 1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVolumeState(v)
      }
    } catch {
      /* bỏ qua */
    }
  }, [])

  const getAudio = useCallback((): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null
    if (!audioRef.current) {
      try {
        const a = new Audio('/audio/rain-loop.mp3')
        a.loop = true
        a.preload = 'auto'
        a.volume = volume * GAIN
        audioRef.current = a
      } catch {
        return null
      }
    }
    return audioRef.current
  }, [volume])

  const toggle = useCallback(() => {
    const a = getAudio()
    if (!a) return
    if (on) {
      a.pause()
      setOn(false)
      return
    }
    a.volume = volume * GAIN
    // play() là promise; autoplay-policy hoặc file thiếu sẽ reject — bắt im
    a.play()
      .then(() => setOn(true))
      .catch(() => setOn(false))
  }, [on, volume, getAudio])

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.min(1, Math.max(0, v))
      setVolumeState(clamped)
      try {
        localStorage.setItem(VOL_KEY, String(clamped))
      } catch {
        /* hết quota — không sao */
      }
      const a = audioRef.current
      if (a) a.volume = clamped * GAIN
    },
    [],
  )

  /* Dừng tiếng mưa khi rời trang */
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  return { on, toggle, volume, setVolume }
}
