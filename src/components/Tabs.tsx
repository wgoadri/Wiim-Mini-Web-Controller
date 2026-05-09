export type View = 'player' | 'search'

interface Props {
  current: View
  onChange: (view: View) => void
}

export default function Tabs({ current, onChange }: Props) {
  const tabs: { id: View; label: string }[] = [
    { id: 'player', label: 'Player' },
    { id: 'search', label: 'Search' },
  ]

  return (
    <div className="mb-6 flex gap-1 rounded-xl bg-surface p-1 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            current === tab.id
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}