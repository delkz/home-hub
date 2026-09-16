import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'ai' | 'success' | 'warning' | 'danger'
}

export function Card({ className, tone = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border p-5',
        tone === 'default' && 'border-line bg-white/80',
        tone === 'ai' && 'border-ai-line bg-ai',
        tone === 'success' && 'border-emerald-200 bg-success-soft',
        tone === 'warning' && 'border-amber-200 bg-warning-soft',
        tone === 'danger' && 'border-rose-200 bg-danger-soft',
        className,
      )}
      {...props}
    />
  )
}
