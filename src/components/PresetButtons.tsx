import { playPreset } from '../api/wiim'

interface Preset {
  slot: number
  label: string
}

// Edit this list to match what you configured in the WiiM Home app.
// Slots not configured on the device will simply do nothing when pressed.
const PRESETS: Preset[] = [
  { slot: 1, label: 'Spotify' },
  { slot: 2, label: 'France Inter' },
  { slot: 3, label: 'Angine de Poitrine Qobuz' },
  { slot: 4, label: 'Preset 4' },
  { slot: 5, label: 'Preset 5' },
  { slot: 6, label: 'Preset 6' },
]

export default function PresetButtons() {
  return (
    <section style={{ margin: '24px 0' }}>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Presets</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.slot}
            onClick={() => playPreset(preset.slot)}
            style={{ padding: '12px 8px' }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  )
}