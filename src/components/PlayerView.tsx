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

      <div className="mb-6 flex items-center justify-center gap-3">
        <button
          onClick={() => previous()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-2xl shadow-sm transition active:scale-95 hover:bg-active"
          aria-label="Previous"
        >
          ⏮
        </button>
        <button
          onClick={() => togglePause()}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl text-white shadow-md transition active:scale-95 hover:bg-accent-deep"
          aria-label="Play / pause"
        >
          ⏯
        </button>
        <button
          onClick={() => next()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-2xl shadow-sm transition active:scale-95 hover:bg-active"
          aria-label="Next"
        >
          ⏭
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