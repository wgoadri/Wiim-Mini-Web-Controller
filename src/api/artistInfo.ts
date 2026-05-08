// Fetches a short bio for an artist from French Wikipedia.
// Free, no auth. Caches results in memory for the session.

export interface ArtistInfo {
  description: string
  url: string
}

interface CacheEntry {
  data: ArtistInfo | null
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

export async function getArtistInfo(artist: string): Promise<ArtistInfo | null> {
  if (!artist) return null

  const key = artist.toLowerCase()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  const term = encodeURIComponent(artist)
  const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${term}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) {
      cache.set(key, { data: null, fetchedAt: Date.now() })
      return null
    }

    const data = await response.json()

    // Disambiguation pages aren't useful — skip them
    if (data.type === 'disambiguation' || !data.extract) {
      cache.set(key, { data: null, fetchedAt: Date.now() })
      return null
    }

    const result: ArtistInfo = {
      description: data.extract,
      url: data.content_urls?.desktop?.page ?? '',
    }

    cache.set(key, { data: result, fetchedAt: Date.now() })
    return result
  } catch {
    clearTimeout(timer)
    cache.set(key, { data: null, fetchedAt: Date.now() })
    return null
  }
}