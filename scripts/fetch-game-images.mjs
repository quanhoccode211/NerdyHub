/**
 * Sinh manifest ảnh minh họa cho game More or Less (phương án B — hotlink).
 *
 * Nguồn ảnh theo từng loại item:
 *   • Nghệ sĩ Việt  -> iTunes Search API (artwork 600x600 — ảnh thật, theo
 *                      bài hit mới nhất của chính ca sĩ)
 *   • Item khác     -> DuckDuckGo Images (size:Large, p_type:photo), chọn
 *                      URL gốc đầu tiên còn sống (validate content-type)
 *
 * Wikipedia từng là nguồn chính nhưng IP này hiện bị Wikimedia throttle toàn
 * bộ endpoint (429) — hàm wikiThumb còn ở dưới, bật lại khi hết chặn nếu muốn
 * nguồn license tự do.
 *
 * Không tải file về — chỉ ghi URL vào components/game/image-manifest.json.
 * Component <img> thẳng + onError fallback emoji; referrerPolicy no-referrer.
 *
 * Idempotent: item đã có trong manifest thì bỏ qua; --force để làm mới toàn bộ.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
// Node 24 strip-types: import được .ts thuần dữ liệu với đuôi file tường minh
import { POOLS } from '../components/game/more-or-less-data.ts'

const OUT_FILE = new URL('../components/game/image-manifest.json', import.meta.url)
const DELAY_MS = 900
const MAX_RETRY = 4

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept-Language': 'vi,en;q=0.9',
}

/** Từ khóa tìm kiếm cho item: bỏ suffix "(…)", tra alias tên khó tra. */
const ALIASES = {
  // Nước tên đơn âm — DDG hay hiểu nhầm nghĩa khác ("Đức" Giáo hoàng…)
  'Đức': 'nước Đức',
  'Anh': 'nước Anh',
  'Pháp': 'nước Pháp',
  'Ý': 'nước Ý',
  'Nga': 'nước Nga',
  'Lào': 'nước Lào',
  // URL BBC chặn hotlink (403 với mọi client) — query tiếng Anh né kết quả BBC
  'Trung Quốc': 'flag of China',
  // Lưu ý: KHÔNG đặt alias chứa chữ "quốc kỳ" — nó nối thêm hint của pool
  // thành query lặp từ ("quốc kỳ X quốc kỳ") khiến DDG trả rác.
  'TP. Hồ Chí Minh': 'Thành phố Hồ Chí Minh',
  'TP.HCM': 'Thành phố Hồ Chí Minh',
  'TP.HCM (tháng 1)': 'Thành phố Hồ Chí Minh',
  Sapa: 'Sa Pa',
  'Thị xã Sapa': 'Sa Pa',
  'Sapa (mùa đông)': 'Sa Pa',
  'Cụm đảo Côn Đảo': 'Côn Đảo',
  'Đảo Phú Quốc': 'Phú Quốc',
  'Pu Si Lung': 'Pu Si Lũng',
  'Tháp Bitexco': 'Landmark Bitexco',
  'Sông Hồng (đoạn VN)': 'Sông Hồng',
  'Phở bò TP.HCM': 'Phở bò',
  'Bún chả Hà Nội': 'Bún chả Hà Nội',
  'Cơm tấm sườn': 'Cơm tấm sườn bì chả',
  'Gạo tấm': 'Cơm tấm',
  'Cà phê sữa đá': 'Cà phê sữa đá Việt Nam',
  'Trà đá vỉa hè': 'trà đá Việt Nam',
  'Chiến thắng Điện Biên Phủ': 'Chiến dịch Điện Biên Phủ 1954',
  'Thống nhất đất nước': 'Ngày thống nhất Việt Nam 30 tháng 4',
  'ĐH Quốc gia Hà Nội (thành lập)': 'Đại học Quốc gia Hà Nội',
  'ĐH Bách Khoa Hà Nội (thành lập)': 'Trường Đại học Bách khoa Hà Nội',
  'Nhà thờ Đức Bà (xây)': 'Nhà thờ Đức Bà Sài Gòn',
  'Chợ Bến Thành (xây)': 'Chợ Bến Thành',
  'jack (J97)': 'Jack J97',
  'Vũ.': 'Vũ ca sĩ',
  K2: 'đỉnh núi K2 Karakoram',
  'Merdeka 118 (Malaysia)': 'Merdeka 118 Kuala Lumpur',
}

/**
 * Ngữ cảnh thêm vào query theo pool. Pool QUỐC GIA (dân số/diện tích/GDP) gắn
 * "quốc kỳ": cờ là ảnh chuẩn nhất cho một nước — search tên trơn dễ dính
 * đồ vô关 (Indonesia -> máy bay Lion Air, Đức -> Đức Giáo hoàng).
 */
const POOL_QUERY_HINT = {
  'Dân số quốc gia': 'quốc kỳ',
  'Diện tích quốc gia': 'quốc kỳ',
  GDP: 'quốc kỳ',
}

/** Item không nên gắn ảnh đại diện — tuyến đường A → B */
function queryFor(poolCategoryName, text) {
  if (text.includes('→')) return null
  const base = text.replace(/\s*\(.*?\)\s*$/, '').trim()
  const q = ALIASES[text] ?? ALIASES[base] ?? base
  const hint = POOL_QUERY_HINT[poolCategoryName]
  return hint ? `${q} ${hint}` : q
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url, extraHeaders = {}) {
  let waitMs = 3_000
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS, Accept: 'application/json', ...extraHeaders },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status === 429 && attempt < MAX_RETRY) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : waitMs
      console.warn(`  ~ 429, chờ ${Math.round(delay / 1000)}s (${new URL(url).host})`)
      await sleep(delay)
      waitMs *= 2
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${new URL(url).host}`)
    return res.json()
  }
}

/** URL ảnh có thật sự tải được không (GET range nhỏ, soi content-type). */
async function isLiveImage(url) {
  try {
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS, Range: 'bytes=0-2047' },
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')
  } catch {
    return false
  }
}

/** Ảnh nghệ sĩ: iTunes Search — artwork bài hit, nâng 100x100 lên 600x600. */
async function itunesArtwork(query) {
  const data = await fetchJson(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=VN`,
  )
  for (const r of data?.results ?? []) {
    if (!r.artworkUrl100) continue
    if (await isLiveImage(r.artworkUrl100)) {
      return { src: r.artworkUrl100.replace('100x100', '600x600'), title: r.trackName }
    }
  }
  return null
}

/** Tìm ảnh qua DuckDuckGo Images: size Large + photo, trả URL gốc đầu sống. */
async function ddgImage(query, maxCheck = 4) {
  const html = await (
    await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    })
  ).text()
  const vqd = html.match(/vqd=["']?([\d-]+)["']?/)?.[1]
  if (!vqd) throw new Error('không lấy được vqd token')

  const api = `https://duckduckgo.com/i.js?l=vn-vn&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,size:Large,p_type:photo,,&p=1`
  const data = await fetchJson(api, { Referer: 'https://duckduckgo.com/' })
  const results = Array.isArray(data?.results) ? data.results : []

  for (const r of results.slice(0, maxCheck)) {
    if (!r.image || (r.width ?? 0) < 400) continue
    if (await isLiveImage(r.image)) {
      return { src: r.image, title: r.title, site: new URL(r.image).host }
    }
  }
  return null
}

async function main() {
  const force = process.argv.includes('--force')
  let manifest = {}
  try {
    manifest = JSON.parse(readFileSync(OUT_FILE, 'utf8'))
  } catch {
    /* chưa có — tạo mới */
  }
  // Ảnh wikipedia lấy được từ lần chạy trước vẫn dùng tốt — giữ lại trừ khi --force
  const stats = []

  for (const pool of POOLS) {
    let found = 0
    const missing = []
    const isArtist = pool.category.name === 'Nghệ sĩ Việt'

    for (const item of pool.items) {
      const key = `${pool.category.name}|${item.text}`
      if (!force && manifest[key]?.src) {
        found++
        continue
      }
      const query = queryFor(pool.category.name, item.text)
      if (query === null) {
        missing.push(`${item.text} (tuyến đường — không ảnh)`)
        continue
      }

      let hit = null
      let source = ''
      let credit = ''
      try {
        if (isArtist) {
          hit = await itunesArtwork(query)
          if (hit) {
            source = 'itunes'
            credit = `Artwork "${hit.title}" — iTunes Search API`
          }
        }
        if (!hit) {
          hit = await ddgImage(query)
          if (hit) {
            source = 'ddg'
            credit = `${hit.title ?? ''} — ${hit.site ?? 'nguồn gốc'} (qua DuckDuckGo Images)`
          }
        }
      } catch (err) {
        console.warn(`  ! lỗi (${query}): ${err.message}`)
      }

      if (hit) {
        manifest[key] = { src: hit.src, source, credit }
        found++
      } else {
        delete manifest[key]
        missing.push(item.text)
      }
      await sleep(DELAY_MS)
    }

    stats.push({ pool: pool.category.name, found, total: pool.items.length, missing })
  }

  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
  writeFileSync(OUT_FILE, JSON.stringify(sorted, null, 2) + '\n')

  console.log(`\n✓ Manifest: ${Object.keys(sorted).length} ảnh`)
  for (const s of stats) {
    const pct = Math.round((s.found / s.total) * 100)
    console.log(`  ${s.pool}: ${s.found}/${s.total} (${pct}%)`)
    if (s.missing.length) console.log(`    thiếu: ${s.missing.join(', ')}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
