import { useEffect, useRef, useState } from 'react'
import { search, getStreamUrl, type QobuzTrack } from '../api/qobuz'
import { playUrl } from '../api/wiim'

interface Props {
  onPlayingTrack: (track: QobuzTrack) => void
}

export default function SearchView({ onPlayingTrack }: Props) {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<QobuzTrack[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setError(null)
    try {
      const data = await search(query.trim())
      setTracks(data.tracks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setTracks(null)
    } finally {
      setSearching(false)
    }
  }

  async function handlePlay(track: QobuzTrack) {
    setPlayingId(track.id)
    setError(null)
    try {
      const url = await getStreamUrl(track.id)
      // Tell App about the playing track BEFORE the play command, so the
      // Player view has metadata ready by the time polling catches up.
      onPlayingTrack(track)
      await playUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback failed')
    } finally {
      setPlayingId(null)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Qobuz…"
            className="flex-1 rounded-lg border border-muted/30 bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || searching}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-accent-deep disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {tracks && tracks.length === 0 && !error && (
        <p className="text-center text-sm text-muted">No tracks found.</p>
      )}

      {tracks && tracks.length > 0 && (
        <ul className="space-y-2">
          {tracks.map((track) => (
            <li
              key={track.id}
              className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-sm"
            >
              {track.albumImage ? (
                <img
                  src={track.albumImage}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-md bg-gradient-to-br from-accent/20 to-accent-deep/10" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-semibold">
                    {track.title}
                  </p>
                  {track.hires && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-accent-deep">
                      Hi-Res
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">
                  {track.artist}
                  {track.album && (
                    <>
                      <span className="mx-1.5 text-muted/40">·</span>
                      {track.album}
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={() => handlePlay(track)}
                disabled={playingId === track.id}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition active:scale-90 hover:bg-accent-deep disabled:opacity-50"
                aria-label={`Play ${track.title}`}
              >
                {playingId === track.id ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="animate-spin"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="14 50"
                    />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l10.6-6.86a1 1 0 0 0 0-1.66L9.55 4.31A1 1 0 0 0 8 5.14z" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}