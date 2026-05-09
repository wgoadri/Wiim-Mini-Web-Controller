import {
  togglePause,
  next,
  previous,
  decodeTrack,
  readableMode,
  type PlayerStatus,
} from '../api/wiim'
import { useAlbumArt } from '../hooks/useAlbumArt'
import { useArtistInfo } from '../hooks/useArtistInfo'
import SourceSwitcher from './SourceSwitcher'
import PresetButtons from './PresetButtons'
import TrackProgress from './TrackProgress'
import type { QobuzTrack } from '../api/qobuz'


function decodeText(value: string): string {
  if (!value) return ''

  const textarea = document.createElement('textarea')
  textarea.innerHTML = value

  return textarea.value
}

function isUnknown(value: string): boolean {
  if (!value) return true

  const normalized = value.trim().toLowerCase()

  return (
    normalized === 'unknown' ||
    normalized === 'unknown artist' ||
    normalized === 'unknown album' ||
    normalized === 'n/a'
  )
}

function shouldLoadAlbumArt(
  artist: string,
  album: string,
  mode: string,
): boolean {
  const normalizedMode = mode.toLowerCase()

  // No metadata sources
  if (
    normalizedMode.includes('line-in') ||
    normalizedMode.includes('aux')
  ) {
    return false
  }

  // Invalid metadata
  if (isUnknown(artist) || isUnknown(album)) {
    return false
  }

  return Boolean(artist && album)
}

function PlayIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l10.6-6.86a1 1 0 0 0 0-1.66L9.55 4.31A1 1 0 0 0 8 5.14z" />
    </svg>
  )
}

function PauseIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  )
}

function PreviousIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="2.5" height="14" rx="0.8" />
      <path d="M20 5.42v13.16a1 1 0 0 1-1.55.83L9 12l9.45-7.41A1 1 0 0 1 20 5.42z" />
    </svg>
  )
}

function NextIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="16.5" y="5" width="2.5" height="14" rx="0.8" />
      <path d="M4 5.42v13.16a1 1 0 0 0 1.55.83L15 12 5.55 4.59A1 1 0 0 0 4 5.42z" />
    </svg>
  )
}

interface NowPlayingProps {
  artist: string
  title: string
  album: string
  qobuzActive: QobuzTrack | null
  status: string
  mode: string
  isPlaying: boolean
  curpos: string
  totlen: string
}

function NowPlaying({
  artist,
  title,
  album,
  qobuzActive,
  status,
  mode,
  isPlaying,
  curpos,
  totlen,
}: NowPlayingProps) {
// Decode whatever the Wiim reported (hex + HTML entities sometimes leak through)
  const wiimTitle = decodeText(title)
  const wiimArtist = decodeText(artist)
  const wiimAlbum = decodeText(album)

  // When we initiated Qobuz playback, the Wiim has no metadata — title comes
  // back as the stream URL. Use our stored Qobuz info instead.
  const titleLooksLikeUrl =
    wiimTitle.startsWith('http://') || wiimTitle.startsWith('https://')
  const useQobuz = qobuzActive !== null && titleLooksLikeUrl

  const decodedTitle = useQobuz ? qobuzActive.title : wiimTitle
  const decodedArtist = useQobuz ? qobuzActive.artist : wiimArtist
  const decodedAlbum = useQobuz ? qobuzActive.album : wiimAlbum
  const albumImageOverride = useQobuz ? qobuzActive.albumImage : null

  const canLoadArt = shouldLoadAlbumArt(decodedArtist, decodedAlbum, mode)

  // Skip iTunes lookup if we already have Qobuz cover art
  const fetchedArt = useAlbumArt(
    canLoadArt && !albumImageOverride ? decodedArtist : '',
    canLoadArt && !albumImageOverride ? decodedAlbum : '',
  )
  const artUrl = albumImageOverride ?? fetchedArt

  const artistInfo = useArtistInfo(canLoadArt ? decodedArtist : '')

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-surface shadow-sm">
      <div className="relative aspect-square w-full bg-gradient-to-br from-accent/30 to-accent-deep/20">
        {artUrl ? (
          <img
            src={artUrl}
            alt={decodedAlbum ? `${decodedAlbum} cover` : 'Album art'}
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-accent-deep/40">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v9.27a4 4 0 1 0 2 3.46V7h4V3z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isPlaying ? 'bg-accent animate-pulse' : 'bg-muted'
            }`}
          />
          {status} · {readableMode(mode)}
        </div>

        <div className="text-lg font-semibold leading-tight">
          {decodedTitle || '—'}
        </div>

        <div className="text-sm text-muted">
          {decodedArtist || '—'}

          {decodedAlbum && !isUnknown(decodedAlbum) && (
            <>
              <span className="mx-1.5 text-muted/40">·</span>
              <span className="italic">{decodedAlbum}</span>
            </>
          )}
        </div>

        <TrackProgress curpos={curpos} totlen={totlen} />

        {artistInfo && (
          <details className="mt-4 border-t border-muted/15 pt-3">
            <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-muted transition hover:text-ink">
              About {decodedArtist}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {artistInfo.description}
            </p>
            {artistInfo.url && (
              <a
                href={artistInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-accent transition hover:text-accent-deep"
              >
                Read more on Wikipedia →
              </a>
            )}
          </details>
        )}
      </div>
    </section>
  )
}

interface Props {
  player: PlayerStatus
  qobuzActive: QobuzTrack | null
  localVolume: number | null
  onVolumeChange: (next: number) => void
}

export default function PlayerView({
  player,
  qobuzActive,
  localVolume,
  onVolumeChange,
}: Props) {
  const track = decodeTrack(player)

  const volume = Number(player.vol)
  const displayVolume = localVolume ?? volume
  const isPlaying = player.status === 'play'

  return (
    <>
      <NowPlaying
        artist={track.artist}
        title={track.title}
        album={track.album}
        qobuzActive={qobuzActive} 
        status={player.status}
        mode={player.mode}
        isPlaying={isPlaying}
        curpos={player.curpos}
        totlen={player.totlen}
      />

      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => previous()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition active:scale-90 hover:bg-active"
          aria-label="Previous"
        >
          <PreviousIcon />
        </button>

        <button
          onClick={() => togglePause()}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-md transition active:scale-90 hover:bg-accent-deep"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          onClick={() => next()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition active:scale-90 hover:bg-active"
          aria-label="Next"
        >
          <NextIcon />
        </button>
      </div>

      <SourceSwitcher currentMode={player.mode} />

      <PresetButtons />

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Volume
          </span>

          <span className="font-mono text-sm font-semibold">
            {displayVolume}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={displayVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </section>
    </>
  )
}