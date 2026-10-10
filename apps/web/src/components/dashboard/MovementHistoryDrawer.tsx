import { ArrowDownIcon, ArrowPathIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import type { InventoryItem, InventoryMovement } from '../../domain/inventory'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'

type MovementHistoryDrawerProps = {
  item?: InventoryItem
  onLoad: (itemId: string) => Promise<InventoryMovement[]>
}

const movementLabel = { IN: 'Entrada', OUT: 'Saída', ADJUSTMENT: 'Ajuste' }

export function MovementHistoryDrawer({ item, onLoad }: MovementHistoryDrawerProps) {
  const open = useUIStore((state) => state.activeDrawer === 'movement-history')
  const closeDrawer = useUIStore((state) => state.closeDrawer)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !item) return
    onLoad(item.id).then(setMovements).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Falha ao carregar histórico.')).finally(() => setLoading(false))
  }, [item, onLoad, open])

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/25 transition ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={closeDrawer} aria-hidden={!open}>
      <aside role="dialog" aria-modal="true" aria-labelledby="history-drawer-title" className={`glass absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[2rem] p-6 transition-transform md:inset-y-6 md:right-6 md:left-auto md:w-120 md:rounded-panel ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`} onClick={(event) => event.stopPropagation()}>
        <header className="mb-7 flex items-start justify-between">
          <div><h2 id="history-drawer-title" className="text-xl font-bold">{item?.icon} {item?.name}</h2><p className="text-xs text-muted">Histórico de movimentações</p></div>
          <Button type="button" variant="secondary" className="size-11 rounded-full px-0" aria-label="Fechar" icon={<XMarkIcon className="size-5" />} onClick={closeDrawer} />
        </header>
        {item?.lastPurchaseAt ? <p className="mb-5 rounded-control bg-success-soft px-4 py-3 text-sm font-semibold text-emerald-800">Última compra: {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(item.lastPurchaseAt))}</p> : null}
        {loading ? <p className="py-10 text-center text-sm text-muted">Carregando histórico...</p> : null}
        {error ? <p className="rounded-control bg-danger-soft px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {!loading && !error && movements.length === 0 ? <p className="py-10 text-center text-sm text-muted">Nenhuma movimentação registrada.</p> : null}
        <div className="grid gap-3">
          {movements.map((movement) => {
            const Icon = movement.type === 'IN' ? ArrowUpIcon : movement.type === 'OUT' ? ArrowDownIcon : ArrowPathIcon
            return <article key={movement.id} className="flex gap-3 rounded-control border border-line bg-white p-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><strong className="text-sm">{movementLabel[movement.type]}{movement.isPurchase ? ' · compra' : ''}</strong><span className="text-sm font-bold">{movement.type === 'OUT' ? '-' : movement.type === 'IN' ? '+' : ''}{movement.quantity}</span></div><p className="mt-1 text-xs text-muted">{movement.previousQuantity} → {movement.resultingQuantity} · {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(movement.occurredAt))}</p>{movement.notes ? <p className="mt-2 truncate text-xs text-slate-600">{movement.notes}</p> : null}</div></article>
          })}
        </div>
      </aside>
    </div>
  )
}
