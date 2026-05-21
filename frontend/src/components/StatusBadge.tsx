import { clsx } from 'clsx'

interface Props {
  status: string
  conclusion?: string | null
}

export function StatusBadge({ status, conclusion }: Props) {
  const label = status === 'completed' ? (conclusion ?? 'completed') : status

  const styles: Record<string, string> = {
    success: 'bg-accent/10 text-accent border-accent/30',
    failure: 'bg-danger/10 text-danger border-danger/30',
    cancelled: 'bg-text-muted/10 text-text-muted border-text-muted/30',
    timed_out: 'bg-warn/10 text-warn border-warn/30',
    in_progress: 'bg-info/10 text-info border-info/30',
    queued: 'bg-warn/10 text-warn border-warn/30',
    skipped: 'bg-muted/50 text-text-muted border-muted',
  }

  const dots: Record<string, string> = {
    success: 'bg-accent',
    failure: 'bg-danger',
    in_progress: 'bg-info animate-pulse',
    queued: 'bg-warn animate-pulse',
    cancelled: 'bg-text-muted',
    timed_out: 'bg-warn',
    skipped: 'bg-muted',
  }

  const style = styles[label] ?? 'bg-muted/30 text-text-muted border-muted'
  const dot = dots[label] ?? 'bg-text-muted'

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-medium', style)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />
      {label.replace('_', ' ')}
    </span>
  )
}
