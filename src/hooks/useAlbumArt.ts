import { useEffect, useState } from 'react'
import { getAlbumArt } from '../api/albumArt'

export function useAlbumArt(
  artist: string,
  album: string,
): string | null {
  const shouldFetch = Boolean(artist && album)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldFetch) return

    let cancelled = false

    getAlbumArt(artist, album).then((result) => {
      if (!cancelled) {
        setUrl(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [artist, album, shouldFetch])

  return shouldFetch ? url : null
}