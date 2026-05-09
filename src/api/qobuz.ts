export interface QobuzTrack {
  id: number
  title: string
  artist: string
  album: string
  albumImage: string
  duration: number
  hires: boolean
}

interface QobuzSearchResults {
  tracks: QobuzTrack[]
}

interface RawQobuzTrack {
  id: number
  title: string
  duration: number
  hires_streamable?: boolean
  performer?: { name: string }
  album?: { title: string; image?: { large?: string } }
}

export async function search(query: string): Promise<QobuzSearchResults> {
  const response = await fetch(
    `/api/qobuz/search?q=${encodeURIComponent(query)}`,
  )

  if (response.status === 503) {
    throw new Error('Qobuz is not configured on the server')
  }
  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`)
  }

  const data = await response.json()
  const items: RawQobuzTrack[] = data.tracks?.items ?? []

  const tracks: QobuzTrack[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    artist: item.performer?.name ?? '',
    album: item.album?.title ?? '',
    albumImage: item.album?.image?.large ?? '',
    duration: item.duration,
    hires: item.hires_streamable ?? false,
  }))

  return { tracks }
}

export async function getStreamUrl(trackId: number): Promise<string> {
  const response = await fetch(`/api/qobuz/track/${trackId}/url`)
  if (!response.ok) {
    throw new Error(`Stream URL resolution failed (${response.status})`)
  }
  const data = await response.json()
  return data.url
}