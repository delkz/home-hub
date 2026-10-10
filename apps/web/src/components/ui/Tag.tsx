import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'ai'
}

export function Tag({ className, tone = 'neutral', ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
        tone === 'neutral' && 'bg-surface-muted text-muted',
        tone === 'success' && 'bg-success-soft text-emerald-700',
        tone === 'warning' && 'bg-warning-soft text-amber-700',
        tone === 'danger' && 'bg-danger-soft text-rose-700',
        tone === 'ai' && 'border border-ai-line bg-white/70 text-indigo-600',
        className,
      )}
      {...props}
    />
  )
}
