import { formatTime } from '../api/wiim'

interface Props {
  curpos: string
  totlen: string
}

export default function TrackProgress({ curpos, totlen }: Props) {
  const cur = Number(curpos)
  const total = Number(totlen)
  const hasProgress = total > 0 && Number.isFinite(cur) && Number.isFinite(total)
  const ratio = hasProgress ? Math.min(1, Math.max(0, cur / total)) : 0

  return (
    <div className="mt-3">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/15">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-linear"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
        <span>{formatTime(curpos)}</span>
        <span>{hasProgress ? formatTime(totlen) : '—:—'}</span>
      </div>
    </div>
  )
}