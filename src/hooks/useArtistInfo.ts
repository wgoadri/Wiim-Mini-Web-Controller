import { useEffect, useState } from 'react'
import { getArtistInfo, type ArtistInfo } from '../api/artistInfo'

export function useArtistInfo(artist: string): ArtistInfo | null {
  const [info, setInfo] = useState<ArtistInfo | null>(null)

  useEffect(() => {
    if (!artist) {
      setInfo(null)
      return
    }

    let cancelled = false
    getArtistInfo(artist).then((result) => {
      if (!cancelled) setInfo(result)
    })

    return () => {
      cancelled = true
    }
  }, [artist])

  return info
}