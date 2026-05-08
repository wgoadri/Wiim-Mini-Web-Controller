import { switchSource, type Source } from '../api/wiim'

const SOURCES: { value: Source; label: string }[] = [
  { value: 'wifi', label: 'Network' },
  { value: 'line-in', label: 'Line-In' },
  { value: 'bluetooth', label: 'Bluetooth' },
]

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
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        Source
      </h2>
      <div className="flex gap-2">
        {SOURCES.map((source) => {
          const isActive = MODE_FOR_SOURCE[source.value].includes(currentMode)
          return (
            <button
              key={source.value}
              onClick={() => switchSource(source.value)}
              className={`flex-1 rounded-xl px-3 py-3 text-sm font-medium transition active:scale-95 ${
                isActive
                  ? 'bg-active ring-2 ring-active-ring text-ink'
                  : 'bg-surface text-muted hover:bg-active/40'
              }`}
            >
              {source.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}