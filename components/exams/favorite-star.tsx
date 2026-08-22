'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/locale-provider'
import { StarIcon } from '@/components/shell/icons'

/**
 * Ngôi sao "quan tâm" trên thẻ đề.
 *
 * `/de-thi/**` là SSG/ISR — trang dựng sẵn lúc build nên HTML không biết ai
 * đang xem. Ngôi sao vì thế luôn render ra ở trạng thái TẮT rồi mới tự sửa lại
 * sau khi hydrate, đúng cách khung giao diện đang đổi ngôn ngữ ở client. Đừng
 * đổi sang đọc `cookies()` ở server để lấy trạng thái đúng ngay từ HTML: một
 * lần gọi đó là cả route rơi khỏi tĩnh, mất luôn lợi thế SEO của SPEC F7.
 */

/*
  MỘT REQUEST CHO CẢ TRANG, không phải mỗi sao một request.

  Trang danh sách có tới vài chục thẻ đề. Để mỗi sao tự `fetch` là vài chục lượt
  gọi cùng một endpoint trong đúng một khung hình. Gom bằng một promise ở tầng
  module: sao nào mount trước thì khởi động, những sao sau chờ chung promise đó.

  Là module-scope nên nó sống qua các lần điều hướng phía client — đó là điều
  MONG MUỐN (đổi trang không phải hỏi lại), và cũng là lý do phải có
  `invalidate()`: sau khi bật/tắt một sao thì bộ nhớ đệm này đã cũ.
*/
type Target = { paperId: string; examId?: never } | { examId: string; paperId?: never }

/** Khoá trong bộ nhớ đệm — gộp hai cấp vào một Set để chỉ phải đồng bộ một chỗ. */
const keyOf = (t: Target) => ('examId' in t ? `exam:${t.examId}` : `paper:${t.paperId}`)

let cache: Promise<Set<string>> | null = null
const listeners = new Set<() => void>()

function loadFavorites(): Promise<Set<string>> {
  cache ??= fetch('/api/favorites')
    .then((r) => (r.ok ? r.json() : {}))
    .then(
      (d: { paperIds?: string[]; examIds?: string[] }) =>
        new Set([
          ...(d.paperIds ?? []).map((id) => `paper:${id}`),
          ...(d.examIds ?? []).map((id) => `exam:${id}`),
        ]),
    )
    /* Hỏng thì coi như chưa đánh sao đề nào và ĐỪNG giữ lại promise lỗi —
       không xoá thì mọi sao trên trang kẹt vĩnh viễn ở trạng thái tắt. */
    .catch(() => {
      cache = null
      return new Set<string>()
    })
  return cache
}

function invalidate(key: string, favorited: boolean) {
  cache?.then((set) => {
    if (favorited) set.add(key)
    else set.delete(key)
    listeners.forEach((fn) => fn())
  })
}

export function FavoriteStar({ className, ...target }: Target & { className?: string }) {
  const { t } = useLocale()
  const [favorited, setFavorited] = useState(false)
  const [pending, setPending] = useState(false)
  const key = keyOf(target as Target)

  useEffect(() => {
    let alive = true
    const sync = () => {
      void loadFavorites().then((set) => {
        if (alive) setFavorited(set.has(key))
      })
    }
    sync()
    listeners.add(sync)
    return () => {
      alive = false
      listeners.delete(sync)
    }
  }, [key])

  async function toggle(e: React.MouseEvent) {
    /*
      Thẻ kỳ thi ở /de-thi phủ một <Link> lên toàn bộ mặt thẻ, và ngôi sao nằm
      TRÊN cái phủ đó. Không chặn ở đây thì mỗi cú bấm sao vừa đánh dấu vừa
      điều hướng sang trang kỳ thi — người dùng bị đá đi trước khi kịp thấy
      ngôi sao đổi màu.
    */
    e.preventDefault()
    e.stopPropagation()
    if (pending) return
    setPending(true)

    /* Lật ngay rồi mới gọi: một cú bấm sao phải phản hồi tức thì, chờ hết một
       vòng mạng mới đổi hình thì đọc ra là nút bị kẹt. Hỏng thì trả về như cũ. */
    const optimistic = !favorited
    setFavorited(optimistic)

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(target),
      })
      if (!res.ok) throw new Error(String(res.status))
      /* Trạng thái thật do SERVER quyết, không phải phép lật ở trên: hai tab
         cùng mở một đề thì phép lật của tab này tính từ một trạng thái đã cũ. */
      const data: { favorited: boolean } = await res.json()
      setFavorited(data.favorited)
      invalidate(key, data.favorited)
    } catch {
      setFavorited(!optimistic)
    } finally {
      setPending(false)
    }
  }

  const label = favorited ? t('favorite.remove') : t('favorite.add')

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={label}
      className={`favorite-star${favorited ? ' is-on' : ''}${className ? ` ${className}` : ''}`}
    >
      <StarIcon size={20} filled={favorited} />
      {/* Nhãn dùng chung cơ chế với nhãn thanh nav — xem .nav-tip ở globals.css */}
      <span className="nav-tip" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}
