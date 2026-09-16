import { PlusIcon, ShoppingCartIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, type FormEvent } from 'react'
import type { CreatePurchaseInput, InventoryItem } from '../../domain/inventory'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

type PurchaseDrawerProps = {
  items: InventoryItem[]
  saving: boolean
  error?: string | null
  onSubmit: (input: CreatePurchaseInput) => Promise<unknown>
}

let lineId = 0
const newLine = () => ({ id: ++lineId, inventoryId: '', quantity: '1' })
const localDateTime = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function PurchaseDrawer({ items, saving, error, onSubmit }: PurchaseDrawerProps) {
  const open = useUIStore((state) => state.activeDrawer === 'purchase')
  const closeDrawer = useUIStore((state) => state.closeDrawer)
  const [store, setStore] = useState('')
  const [notes, setNotes] = useState('')
  const [purchasedAt, setPurchasedAt] = useState(localDateTime)
  const [lines, setLines] = useState(() => [newLine(), newLine()])
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closeDrawer, open])

  const updateLine = (id: number, field: 'inventoryId' | 'quantity', value: string) => setLines((current) => current.map((line) => line.id === id ? { ...line, [field]: value } : line))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const completedLines = lines.filter((line) => line.inventoryId)
    const ids = completedLines.map((line) => line.inventoryId)
    if (completedLines.length === 0 || completedLines.some((line) => Number(line.quantity) <= 0)) {
      setValidationError('Adicione ao menos um item com quantidade válida.')
      return
    }
    if (new Set(ids).size !== ids.length) {
      setValidationError('O mesmo item não pode aparecer duas vezes na compra.')
      return
    }

    setValidationError(null)
    try {
      await onSubmit({
        store: store.trim() || undefined,
        notes: notes.trim() || undefined,
        purchasedAt: new Date(purchasedAt).toISOString(),
        items: completedLines.map((line) => ({ inventoryId: line.inventoryId, quantity: Number(line.quantity) })),
      })
      closeDrawer()
    } catch {
      // The request error is rendered below.
    }
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/25 transition ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={closeDrawer} aria-hidden={!open}>
      <aside role="dialog" aria-modal="true" aria-labelledby="purchase-drawer-title" className={`glass absolute inset-x-0 bottom-0 max-h-[94vh] overflow-y-auto rounded-t-[2rem] p-6 transition-transform md:inset-y-6 md:right-6 md:left-auto md:w-136 md:rounded-panel ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`} onClick={(event) => event.stopPropagation()}>
        <header className="mb-7 flex items-start justify-between">
          <div><h2 id="purchase-drawer-title" className="text-xl font-bold">Registrar compra</h2><p className="text-xs text-muted">Inclua todos os itens da mesma compra</p></div>
          <Button type="button" variant="secondary" className="size-11 rounded-full px-0" aria-label="Fechar" icon={<XMarkIcon className="size-5" />} onClick={closeDrawer} />
        </header>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="purchase-store" label="Mercado ou loja" placeholder="Ex.: Mercado Central" value={store} onChange={(event) => setStore(event.target.value)} />
            <Input id="purchase-date" label="Data e hora" type="datetime-local" value={purchasedAt} onChange={(event) => setPurchasedAt(event.target.value)} />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Itens comprados</h3><Button type="button" variant="secondary" className="min-h-10 px-3" icon={<PlusIcon className="size-4" />} onClick={() => setLines((current) => [...current, newLine()])}>Adicionar</Button></div>
            {lines.map((line, index) => <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.75rem] items-end gap-2 rounded-control border border-line bg-white p-3"><Select id={`purchase-item-${line.id}`} label={`Item ${index + 1}`} value={line.inventoryId} onChange={(event) => updateLine(line.id, 'inventoryId', event.target.value)}><option value="">Selecione</option>{items.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}</Select><Input id={`purchase-quantity-${line.id}`} label="Qtd." type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} /><Button type="button" variant="secondary" className="size-11 px-0 text-rose-600" aria-label={`Remover item ${index + 1}`} disabled={lines.length === 1} icon={<TrashIcon className="size-5" />} onClick={() => setLines((current) => current.filter((candidate) => candidate.id !== line.id))} /></div>)}
          </div>

          <Input id="purchase-notes" label="Observação da compra" placeholder="Ex.: compra do mês" value={notes} onChange={(event) => setNotes(event.target.value)} />
          {validationError || error ? <p className="rounded-control bg-danger-soft px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{validationError || error}</p> : null}
          <Button type="submit" className="mt-3 w-full" disabled={saving} icon={<ShoppingCartIcon className="size-5" />}>{saving ? 'Registrando compra...' : `Registrar compra com ${lines.filter((line) => line.inventoryId).length} itens`}</Button>
        </form>
      </aside>
    </div>
  )
}
