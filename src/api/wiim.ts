async function command(cmd: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(
      `/api/wiim/httpapi.asp?command=${cmd}`,
      { signal: controller.signal },
    )
    if (!response.ok) throw new Error(`Wiim error ${response.status}`)
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

async function commandJson<T>(cmd: string): Promise<T> {
  return JSON.parse(await command(cmd)) as T
}

// Wiim returns track metadata as hex-encoded UTF-8
function hexDecode(hex: string): string {
  if (!hex) return ''
  try {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return hex
  }
}

export interface DeviceInfo {
  DeviceName: string
  firmware: string
  ssid: string
  MAC: string
}

export interface PlayerStatus {
  status: 'stop' | 'play' | 'pause' | 'loading'
  mode: string
  vol: string
  mute: string
  Title: string
  Artist: string
  Album: string
  curpos: string
  totlen: string
}

export const getDeviceInfo = () => commandJson<DeviceInfo>('getStatusEx')
export const getPlayerStatus = () => commandJson<PlayerStatus>('getPlayerStatus')

export const togglePause = () => command('setPlayerCmd:onepause')
export const next = () => command('setPlayerCmd:next')
export const previous = () => command('setPlayerCmd:prev')
export const setVolume = (v: number) => command(`setPlayerCmd:vol:${v}`)

export const decodeTrack = (s: PlayerStatus) => ({
  title: hexDecode(s.Title),
  artist: hexDecode(s.Artist),
  album: hexDecode(s.Album),
})

export const playPreset = (slot: number) => command(`MCUKeyShortClick:${slot}`)

export type Source = 'wifi' | 'line-in' | 'bluetooth'

export const switchSource = (source: Source) =>
  command(`setPlayerCmd:switchmode:${source}`)

export function readableMode(mode: string): string {
  switch (mode) {
    case '0':  return 'Idle'
    case '10': return 'Streaming'
    case '31': return 'Spotify'
    case '40': return 'Line-In'
    case '41': return 'Bluetooth'
    default:   return `Mode ${mode}`
  }
}