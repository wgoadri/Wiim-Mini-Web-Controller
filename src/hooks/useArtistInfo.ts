import { useEffect, useState } from 'react'
import { getArtistInfo, type ArtistInfo } from '../api/artistInfo'

interface State {
  artist: string
  info: ArtistInfo | null
}

export function useArtistInfo(artist: string): ArtistInfo | null {
  const [state, setState] = useState<State>({ artist: '', info: null })

  useEffect(() => {
    if (!artist) return

    let cancelled = false
    getArtistInfo(artist).then((result) => {
      if (!cancelled) setState({ artist, info: result })
    })

    return () => {
      cancelled = true
    }
  }, [artist])

  // Only show info that matches the current artist. Mismatches happen
  // briefly when artist changes — the fetch hasn't returned yet.
  return state.artist === artist ? state.info : null
}