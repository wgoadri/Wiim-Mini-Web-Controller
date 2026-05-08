import { useEffect, useState } from 'react'
import { getAlbumArt } from '../api/albumArt'

interface State {
  artist: string
  album: string
  url: string | null
}

export function useAlbumArt(artist: string, album: string): string | null {
  const [state, setState] = useState<State>({ artist: '', album: '', url: null })

  useEffect(() => {
    if (!artist || !album) return

    let cancelled = false
    getAlbumArt(artist, album).then((result) => {
      if (!cancelled) setState({ artist, album, url: result })
    })

    return () => {
      cancelled = true
    }
  }, [artist, album])

  return state.artist === artist && state.album === album ? state.url : null
}