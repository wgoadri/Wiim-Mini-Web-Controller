// Looks up album artwork from the iTunes Search API.
// Free, no auth, no key. Caches results in memory for the session.

interface CacheEntry {
  url: string | null
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h — albums don't change

function cacheKey(artist: string, album: string): string {
  return `${artist.toLowerCase()}::${album.toLowerCase()}`
}

interface ITunesResult {
  artworkUrl100?: string
}

interface ITunesResponse {
  resultCount: number
  results: ITunesResult[]
}

export async function getAlbumArt(
  artist: string,
  album: string,
): Promise<string | null> {
  if (!artist || !album) return null

  const key = cacheKey(artist, album)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.url
  }

  const term = encodeURIComponent(`${artist} ${album}`)
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) throw new Error(`iTunes ${response.status}`)
    const data: ITunesResponse = await response.json()

    // artworkUrl100 is 100x100 — swap to 600x600 for a sharp display
    const raw = data.results[0]?.artworkUrl100 ?? null
    const hires = raw ? raw.replace('100x100bb', '600x600bb') : null

    cache.set(key, { url: hires, fetchedAt: Date.now() })
    return hires
  } catch {
    // Cache the miss so we don't hammer the API for unknown albums
    cache.set(key, { url: null, fetchedAt: Date.now() })
    return null
  }
}