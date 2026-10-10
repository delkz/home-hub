import { ArrowDownIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, type FormEvent } from 'react'
import type { CreateInventoryMovementInput, InventoryItem, MovementType } from '../../domain/inventory'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

type MovementDrawerProps = {
  items: InventoryItem[]
  saving: boolean
  error?: string | null
  onSubmit: (input: CreateInventoryMovementInput) => Promise<unknown>
}

const localDateTime = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function MovementDrawer({ items, saving, error, onSubmit }: MovementDrawerProps) {
  const open = useUIStore((state) => state.activeDrawer === 'inventory-movement')
  const initialItemId = useUIStore((state) => state.movementItemId)
  const initialType = useUIStore((state) => state.movementType)
  const closeDrawer = useUIStore((state) => state.closeDrawer)
  const [form, setForm] = useState({
    itemId: initialItemId || '',
    type: initialType,
    quantity: '1',
    occurredAt: localDateTime(),
    notes: '',
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closeDrawer, open])

  const update = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.itemId || Number(form.quantity) <= 0) {
      setValidationError('Selecione um item e informe uma quantidade válida.')
      return
    }

    setValidationError(null)
    try {
      await onSubmit({
        inventoryId: form.itemId,
        type: form.type,
        quantity: Number(form.quantity),
        notes: form.notes.trim() || undefined,
        occurredAt: new Date(form.occurredAt).toISOString(),
      })
      closeDrawer()
    } catch {
      // The request error is rendered below.
    }
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/25 transition ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={closeDrawer} aria-hidden={!open}>
      <aside role="dialog" aria-modal="true" aria-labelledby="movement-drawer-title" className={`glass absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[2rem] p-6 transition-transform md:inset-y-6 md:right-6 md:left-auto md:w-120 md:rounded-panel ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`} onClick={(event) => event.stopPropagation()}>
        <header className="mb-7 flex items-start justify-between">
          <div><h2 id="movement-drawer-title" className="text-xl font-bold">Registrar movimentação</h2><p className="text-xs text-muted">Entrada, consumo ou ajuste de estoque</p></div>
          <Button type="button" variant="secondary" className="size-11 rounded-full px-0" aria-label="Fechar" icon={<XMarkIcon className="size-5" />} onClick={closeDrawer} />
        </header>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Select id="movement-item" label="Item" value={form.itemId} onChange={(event) => update('itemId', event.target.value)} required>
            <option value="">Selecione um item</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select id="movement-type" label="Tipo" value={form.type} onChange={(event) => update('type', event.target.value as MovementType)}>
              <option value="IN">Entrada</option><option value="OUT">Saída / consumo</option><option value="ADJUSTMENT">Ajuste de saldo</option>
            </Select>
            <Input id="movement-quantity" label={form.type === 'ADJUSTMENT' ? 'Novo saldo' : 'Quantidade'} type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} />
          </div>
          <Input id="movement-date" label="Data e hora" type="datetime-local" value={form.occurredAt} onChange={(event) => update('occurredAt', event.target.value)} />
          <Input id="movement-notes" label="Observação" placeholder="Ex.: compra do mercado" value={form.notes} onChange={(event) => update('notes', event.target.value)} />
          {validationError || error ? <p className="rounded-control bg-danger-soft px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{validationError || error}</p> : null}
          <Button type="submit" className="mt-3 w-full" disabled={saving} icon={form.type === 'OUT' ? <ArrowDownIcon className="size-5" /> : <ArrowUpIcon className="size-5" />}>{saving ? 'Registrando...' : 'Registrar movimentação'}</Button>
        </form>
      </aside>
    </div>
  )
}
