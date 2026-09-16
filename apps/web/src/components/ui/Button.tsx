import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ className, icon, children, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-white hover:bg-blue-700',
        variant === 'secondary' && 'border border-line bg-white/80 text-ink hover:bg-white',
        variant === 'ghost' && 'bg-transparent text-muted hover:bg-surface-muted hover:text-ink',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
