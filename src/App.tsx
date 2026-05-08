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

  return (
    <main className="mx-auto max-w-md min-h-screen px-5 py-8 sm:px-6 sm:py-12">
      <header className="mb-6">
        {device ? (
          <h1 className="text-3xl font-bold tracking-tight">
            {device.DeviceName}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight text-muted">
            Wiim Controller
          </h1>
        )}

        {pollFailures >= 3 && (
          <p className="mt-2 text-sm text-danger">
            Device unreachable. Last update may be stale.
          </p>
        )}

        {error && !device && (
          <p className="mt-2 text-sm text-danger">
            Could not reach the device. Check the host below.
          </p>
        )}
      </header>

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
        <p className="text-muted">Waiting for device…</p>
      )}

      <DeviceSettings host={host} onHostChange={setHost} />
    </main>
  )
}