import { Card } from '../ui/Card'

type StatCardProps = {
  label: string
  value: string | number
  tone: 'success' | 'warning' | 'danger'
}

const accent = { success: 'bg-emerald-600', warning: 'bg-amber-700', danger: 'bg-rose-200' }

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <Card tone={tone} className="min-h-26 min-w-0 flex-1 p-4 md:p-5">
      <strong className="block text-3xl leading-none">{value}</strong>
      <span className="mt-2 block text-xs font-semibold">{label}</span>
      <span className={`mt-4 block h-1 w-15 rounded-full ${accent[tone]}`} />
    </Card>
  )
}
