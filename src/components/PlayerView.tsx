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

  return (
    <>
      <p>Status: {player.status} · {readableMode(player.mode)}</p>
      <p>{track.artist || '—'} — {track.title || '—'}</p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button onClick={() => previous()}>⏮</button>
        <button onClick={() => togglePause()}>⏯</button>
        <button onClick={() => next()}>⏭</button>
      </div>

      <SourceSwitcher currentMode={player.mode} />

      <PresetButtons />

      <label>
        Volume: {displayVolume}
        <input
          type="range"
          min={0}
          max={100}
          value={displayVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          style={{ width: '100%', display: 'block' }}
        />
      </label>
    </>
  )
}