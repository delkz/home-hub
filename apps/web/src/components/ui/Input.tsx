import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, id, ...props },
  ref,
) {
  return (
    <label className="grid gap-2 text-xs font-bold text-muted" htmlFor={id}>
      {label}
      <input
        ref={ref}
        id={id}
        className={cn(
          'min-h-14 w-full rounded-control border border-line bg-surface-muted px-4 text-sm font-medium text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100',
          className,
        )}
        {...props}
      />
    </label>
  )
})
