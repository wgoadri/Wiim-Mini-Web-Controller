import { playPreset } from '../api/wiim'

interface Preset {
  slot: number
  label: string
}

// Edit this list to match what you configured in the WiiM Home app.
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
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        Presets
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.slot}
            onClick={() => playPreset(preset.slot)}
            className="rounded-xl bg-surface px-3 py-4 text-sm font-medium shadow-sm transition active:scale-95 hover:bg-active"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  )
}