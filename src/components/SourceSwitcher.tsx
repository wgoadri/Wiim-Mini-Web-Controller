import { switchSource, type Source } from '../api/wiim'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'wifi', label: 'Network' },
  { value: 'line-in', label: 'Line-In' },
  { value: 'bluetooth', label: 'Bluetooth' },
]

// Mode codes that indicate each source is active.
// "Network" covers idle, generic streaming, and Spotify Connect —
// anything that isn't a hardware input.
const MODE_FOR_SOURCE: Record<Source, string[]> = {
  'wifi': ['0', '10', '31'],
  'line-in': ['40'],
  'bluetooth': ['41'],
}

interface Props {
  currentMode: string
}

export default function SourceSwitcher({ currentMode }: Props) {
  return (
    <section style={{ margin: '24px 0' }}>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Source</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {SOURCES.map((source) => {
          const isActive = MODE_FOR_SOURCE[source.value].includes(currentMode)
          return (
            <button
              key={source.value}
              onClick={() => switchSource(source.value)}
              style={{
                flex: 1,
                padding: '12px 8px',
                fontWeight: isActive ? 'bold' : 'normal',
                background: isActive ? '#e0e0e0' : undefined,
              }}
            >
              {source.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}