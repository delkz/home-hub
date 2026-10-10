import { SparklesIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Tag } from '../ui/Tag'

export function InsightsCard() {
  return (
    <Card tone="ai" className="min-h-45 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SparklesIcon className="size-6 shrink-0 text-indigo-500" />
          <h2 className="text-lg font-bold">Insights da IA</h2>
        </div>
        <Tag tone="ai">em breve</Tag>
      </div>
      <p className="mt-4 text-sm text-slate-600">Previsões de consumo e sugestões de compra para desenvolver depois.</p>
      <Button className="mt-5" variant="secondary">Explorar depois</Button>
    </Card>
  )
}
