import type { ComponentType, SVGProps } from 'react'
import { Card } from '../ui/Card'

type QuickActionCardProps = {
  title: string
  caption: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: 'success' | 'warning'
  onClick?: () => void
}

export function QuickActionCard({ title, caption, icon: Icon, tone, onClick }: QuickActionCardProps) {
  return (
    <button className="text-left" onClick={onClick}>
      <Card tone={tone} className="flex min-h-17 items-center gap-4 px-5 py-3 transition-transform hover:-translate-y-0.5">
        <span className="grid size-11 place-items-center rounded-full border border-current/25 bg-white/70"><Icon className="size-6" /></span>
        <span><strong className="block text-sm">{title}</strong><span className="text-xs text-muted">{caption}</span></span>
      </Card>
    </button>
  )
}
