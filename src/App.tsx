import { useEffect, useState } from 'react'
import {
  getDeviceInfo,
  getPlayerStatus,
  togglePause,
  next,
  previous,
  setVolume,
  decodeTrack,
  type DeviceInfo,
  type PlayerStatus,
} from './api/wiim'

export default function App() {
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [player, setPlayer] = useState<PlayerStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDeviceInfo().then(setDevice).catch((e) => setError(String(e)))
  }, [])

  useEffect(() => {
    const tick = () => getPlayerStatus().then(setPlayer).catch(() => {})
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [])

  if (error) return <pre>Error: {error}</pre>
  if (!device || !player) return <p>Loading…</p>

  const track = decodeTrack(player)
  const volume = Number(player.vol)

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 480 }}>
      <h1>{device.DeviceName}</h1>
      <p>Status: {player.status}</p>
      <p>{track.artist || '—'} — {track.title || '—'}</p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button onClick={() => previous()}>⏮</button>
        <button onClick={() => togglePause()}>⏯</button>
        <button onClick={() => next()}>⏭</button>
      </div>

      <label>
        Volume: {volume}
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: '100%', display: 'block' }}
        />
      </label>
    </main>
  )
}