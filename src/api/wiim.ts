const BASE = '/api/wiim/httpapi.asp'

async function command(cmd: string): Promise<string> {
  const response = await fetch(`${BASE}?command=${cmd}`)
  if (!response.ok) throw new Error(`Wiim error ${response.status}`)
  return response.text()
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

// Triggers a preset (1-12) configured in the WiiM Home app.
// Note: no setPlayerCmd: prefix — this is undocumented but works.
export const playPreset = (slot: number) => command(`MCUKeyShortClick:${slot}`)

export type Source = 'wifi' | 'line-in' | 'bluetooth'

export const switchSource = (source: Source) =>
  command(`setPlayerCmd:switchmode:${source}`)

// The `mode` field in PlayerStatus is a numeric code.
// Mapping observed from LinkPlay devices:
//   10 = wifi/network, 40 = line-in, 41 = bluetooth, 99 = idle
export function readableMode(mode: string): string {
  switch (mode) {
    case '10': return 'WiFi'
    case '40': return 'Line-In'
    case '41': return 'Bluetooth'
    case '99': return 'Idle'
    default: return `Mode ${mode}`
  }
}