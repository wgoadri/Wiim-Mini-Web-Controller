import { switchSource, type Source } from '../api/wiim'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'line-in', label: 'Line-In' },
  { value: 'bluetooth', label: 'Bluetooth' },
]

interface Props {
  currentMode: string
}

// Maps a Source value to the mode codes that indicate it's active.
const MODE_FOR_SOURCE: Record<Source, string[]> = {
  'wifi': ['10', '99'],
  'line-in': ['40'],
  'bluetooth': ['41'],
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