import {
  togglePause,
  next,
  previous,
  decodeTrack,
  readableMode,
  type PlayerStatus,
} from '../api/wiim'
import SourceSwitcher from './SourceSwitcher'
import PresetButtons from './PresetButtons'

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

interface Props {
  player: PlayerStatus
  localVolume: number | null
  onVolumeChange: (next: number) => void
}

export default function PlayerView({ player, localVolume, onVolumeChange }: Props) {
  const track = decodeTrack(player)
  const volume = Number(player.vol)
  const displayVolume = localVolume ?? volume
  const isPlaying = player.status === 'play'

  return (
    <>
      <section className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isPlaying ? 'bg-accent animate-pulse' : 'bg-muted'
            }`}
          />
          {player.status} · {readableMode(player.mode)}
        </div>
        <div className="text-lg font-semibold leading-tight">
          {track.title || '—'}
        </div>
        <div className="text-sm text-muted">
          {track.artist || '—'}
        </div>
      </section>

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