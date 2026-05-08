import { useEffect, useRef, useState } from 'react'
import {
  getDeviceInfo,
  getPlayerStatus,
  setVolume,
  type DeviceInfo,
  type PlayerStatus,
} from './api/wiim'
import PlayerView from './components/PlayerView'
import DeviceSettings from './components/DeviceSettings'
import { useDeviceHost } from './hooks/useDeviceHost'

export default function App() {
  const [host, setHost] = useDeviceHost()
  const [device, setDevice] = useState<DeviceInfo | null>(null)
  const [player, setPlayer] = useState<PlayerStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localVolume, setLocalVolume] = useState<number | null>(null)
  const volumeTimer = useRef<number | null>(null)
  const [pollFailures, setPollFailures] = useState(0)

  useEffect(() => {
      getDeviceInfo()
        .then((info) => {
          setDevice(info)
          setError(null)
        })
        .catch((e) => setError(String(e)))
  }, [host])
    
  useEffect(() => {
    const tick = async () => {
      try {
        const status = await getPlayerStatus()
        setPlayer(status)
        setPollFailures(0)
      } catch {
        setPollFailures((n) => n + 1)
      }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [host])

  if (error) return <pre>Error: {error}</pre>
  if (!device || !player) return <p>Loading…</p>

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 480 }}>
      {device ? (
        <h1>{device.DeviceName}</h1>
      ) : (
        <h1 style={{ color: '#888' }}>Wiim Controller</h1>
      )}

      {pollFailures >= 3 && (
        <p style={{ color: 'crimson', fontSize: 13, margin: '8px 0' }}>
          Device unreachable. Last update may be stale.
        </p>
      )}

      {error && !device && (
        <p style={{ color: 'crimson', fontSize: 13, margin: '8px 0' }}>
          Could not reach the device. Check the host below.
        </p>
      )}

      {device && player ? (
        <PlayerView
          player={player}
          localVolume={localVolume}
          onVolumeChange={(next) => {
            setLocalVolume(next)
            if (volumeTimer.current) clearTimeout(volumeTimer.current)
            volumeTimer.current = window.setTimeout(() => {
              setVolume(next)
              setLocalVolume(null)
            }, 150)
          }}
        />
      ) : (
        <p style={{ color: '#888' }}>Waiting for device…</p>
      )}

      <DeviceSettings host={host} onHostChange={setHost} />
    </main>
  )
}