import { useEffect, useRef, useState } from 'react'
import {
  getDeviceInfo,
  getPlayerStatus,
  setVolume,
  type DeviceInfo,
  type PlayerStatus,
} from './api/wiim'
import type { QobuzTrack } from './api/qobuz'
import PlayerView from './components/PlayerView'
import SearchView from './components/SearchView'
import Tabs, { type View } from './components/Tabs'

export default function App() {
  const [view, setView] = useState<View>('player')
  const [qobuzActive, setQobuzActive] = useState<QobuzTrack | null>(null)

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
  }, [])

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
  }, [])

  return (
    <main className="mx-auto max-w-md min-h-screen px-5 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 text-center">
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
            Could not reach the device. Check that your Wiim is on the network
            and that <code className="font-mono">VITE_WIIM_HOST</code> in{' '}
            <code className="font-mono">.env.local</code> matches its IP, then
            restart the dev server.
          </p>
        )}
      </header>

      <Tabs current={view} onChange={setView} />

      {view === 'player' &&
        (device && player ? (
          <PlayerView
            player={player}
            qobuzActive={qobuzActive}
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
          <p className="text-center text-muted">Waiting for device…</p>
        ))}

      {view === 'search' && <SearchView onPlayingTrack={setQobuzActive} />}
    </main>
  )
}