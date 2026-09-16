import { useEffect, useState, type FormEvent } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { CreateInventoryItemInput, InventoryCategory, InventoryItem } from '../../domain/inventory'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

type NewItemDrawerProps = {
  item?: InventoryItem
  categories: InventoryCategory[]
  saving: boolean
  error?: string | null
  onSubmit: (input: CreateInventoryItemInput, itemId?: string) => Promise<unknown>
}

function initialForm(item?: InventoryItem) {
  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    quantity: String(item?.quantity ?? 0),
    unit: item?.unit ?? 'un',
    minQuantity: item?.minQuantity === null || item?.minQuantity === undefined ? '' : String(item.minQuantity),
    categoryId: item?.categoryId ?? '',
  }
}

export function NewItemDrawer({ item, categories, saving, error, onSubmit }: NewItemDrawerProps) {
  const open = useUIStore((state) => state.activeDrawer === 'inventory-item')
  const closeDrawer = useUIStore((state) => state.closeDrawer)
  const [form, setForm] = useState(() => initialForm(item))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closeDrawer, open])

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setValidationError('Informe o nome do item.')
      return
    }

    setValidationError(null)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        quantity: Number(form.quantity) || 0,
        unit: form.unit,
        minQuantity: form.minQuantity === '' ? null : Number(form.minQuantity),
        categoryId: form.categoryId || null,
      }, item?.id)
      closeDrawer()
    } catch {
      // The request error is rendered from the inventory hook.
    }
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/25 transition ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={closeDrawer} aria-hidden={!open}>
      <aside role="dialog" aria-modal="true" aria-labelledby="item-drawer-title" className={`glass absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[2rem] p-6 transition-transform md:inset-y-6 md:right-6 md:left-auto md:w-120 md:rounded-panel ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`} onClick={(event) => event.stopPropagation()}>
        <header className="mb-7 flex items-start justify-between">
          <div><h2 id="item-drawer-title" className="text-xl font-bold">{item ? 'Editar item' : 'Novo item'}</h2><p className="text-xs text-muted">{item ? 'Atualize os dados do inventário' : 'Adicione ao inventário da casa'}</p></div>
          <Button type="button" variant="secondary" className="size-11 rounded-full px-0" aria-label="Fechar" icon={<XMarkIcon className="size-5" />} onClick={closeDrawer} />
        </header>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input id="item-name" label="Nome do item" placeholder="Ex.: Café" value={form.name} onChange={(event) => update('name', event.target.value)} required />
          <Input id="item-description" label="Notas e observações" placeholder="Ex.: Despensa da cozinha" value={form.description} onChange={(event) => update('description', event.target.value)} />
          <Select id="item-category" label="Categoria" value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input id="item-quantity" label="Quantidade" type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} />
            <Select id="item-unit" label="Unidade" value={form.unit} onChange={(event) => update('unit', event.target.value)}><option value="un">un</option><option value="kg">kg</option><option value="g">g</option><option value="l">l</option><option value="ml">ml</option><option value="pct">pacote</option></Select>
          </div>
          <Input id="item-minimum" label="Estoque mínimo" type="number" min="0" step="0.01" value={form.minQuantity} onChange={(event) => update('minQuantity', event.target.value)} />

          {validationError || error ? <p className="rounded-control bg-danger-soft px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{validationError || error}</p> : null}
          <Button type="submit" className="mt-3 w-full" disabled={saving}>{saving ? 'Salvando...' : item ? 'Salvar alterações' : 'Adicionar item'}</Button>
        </form>
      </aside>
    </div>
  )
}
