import { MinusIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import type { InventoryItem } from '../../domain/inventory'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Tag } from '../ui/Tag'

type InventoryListProps = {
  items: InventoryItem[]
  loading: boolean
  busyItemId: string | null
  onAdjust: (item: InventoryItem, change: number) => Promise<void>
  onDelete: (item: InventoryItem) => Promise<void>
  title?: string
  action?: ReactNode
}

const statusConfig = {
  OK: { label: 'ok', tone: 'success' as const, dot: 'bg-success-soft' },
  LOW: { label: 'baixo', tone: 'warning' as const, dot: 'bg-warning-soft' },
  EMPTY: { label: 'zerado', tone: 'danger' as const, dot: 'bg-danger-soft' },
}

export function InventoryList({ items, loading, busyItemId, onAdjust, onDelete, title = 'Itens atuais', action }: InventoryListProps) {
  const openEditItem = useUIStore((state) => state.openEditItem)

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Excluir ${item.name}?`)) await onDelete(item)
  }

  return (
    <Card className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {action ?? <span className="text-xs font-bold text-primary">{items.length} itens</span>}
      </div>

      {loading ? <p className="py-10 text-center text-sm text-muted">Carregando inventário...</p> : null}
      {!loading && items.length === 0 ? <p className="py-10 text-center text-sm text-muted">Nenhum item encontrado.</p> : null}

      <div className="grid gap-3">
        {items.map((item) => {
          const status = statusConfig[item.status]
          const busy = busyItemId === item.id
          return (
            <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-white px-4 py-3">
              <span className={`size-8 shrink-0 rounded-xl ${status.dot}`} />
              <div className="min-w-32 flex-1"><strong className="block text-sm">{item.name}</strong><span className="block truncate text-xs text-muted">{item.quantity} {item.unit}{item.description ? ` · ${item.description}` : ''}</span></div>
              <Tag tone={status.tone}>{status.label}</Tag>
              <div className="ml-auto flex basis-full items-center justify-end gap-2 pt-1 sm:basis-auto sm:pt-0">
                <Button type="button" variant="secondary" className="h-10 min-h-10 w-10 min-w-10 rounded-full p-0" aria-label={`Diminuir ${item.name}`} disabled={busy || item.quantity <= 0} icon={<MinusIcon className="h-5 w-5 shrink-0 stroke-2" />} onClick={() => void onAdjust(item, -1)} />
                <Button type="button" variant="secondary" className="h-10 min-h-10 w-10 min-w-10 rounded-full p-0 text-primary" aria-label={`Aumentar ${item.name}`} disabled={busy} icon={<PlusIcon className="h-5 w-5 shrink-0 stroke-2" />} onClick={() => void onAdjust(item, 1)} />
                <Button type="button" variant="secondary" className="h-10 min-h-10 w-10 min-w-10 rounded-full p-0" aria-label={`Editar ${item.name}`} disabled={busy} icon={<PencilSquareIcon className="h-5 w-5 shrink-0 stroke-2" />} onClick={() => openEditItem(item.id)} />
                <Button type="button" variant="secondary" className="h-10 min-h-10 w-10 min-w-10 rounded-full border-rose-200 p-0 text-rose-600" aria-label={`Excluir ${item.name}`} disabled={busy} icon={<TrashIcon className="h-5 w-5 shrink-0 stroke-2" />} onClick={() => void handleDelete(item)} />
              </div>
            </article>
          )
        })}
      </div>
    </Card>
  )
}
