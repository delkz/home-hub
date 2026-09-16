import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { InventoryList } from '../components/dashboard/InventoryList'
import { Button } from '../components/ui/Button'
import type { InventoryController } from '../hooks/useInventory'
import { useUIStore } from '../store/uiStore'

type InventoryPageProps = {
  inventory: InventoryController
}

export function InventoryPage({ inventory }: InventoryPageProps) {
  const openNewItem = useUIStore((state) => state.openNewItem)
  const searchQuery = useUIStore((state) => state.searchQuery)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const visibleItems = normalizedSearch
    ? inventory.items.filter((item) => `${item.name} ${item.description ?? ''} ${item.unit}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : inventory.items

  return (
    <main className="px-6 pt-7 pb-28 md:px-0 md:pb-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-primary">Inventário</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Todos os itens</h1>
          <p className="mt-2 text-sm text-muted">Consulte, ajuste e edite o estoque da casa.</p>
        </div>
        <Button className="w-full sm:w-auto" icon={<PlusIcon className="size-5" />} onClick={openNewItem}>Novo item</Button>
      </div>

      <label className="mb-5 flex items-center gap-3 rounded-control border border-line bg-white px-4 py-3 text-sm text-muted md:hidden">
        <MagnifyingGlassIcon className="size-5 shrink-0" />
        <input className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar no inventário" aria-label="Buscar no inventário" />
      </label>

      {inventory.error ? <button type="button" className="mb-4 text-sm font-bold text-rose-700" onClick={() => void inventory.load()}>Falha ao carregar. Tentar novamente</button> : null}

      <InventoryList
        title="Inventário completo"
        items={visibleItems}
        loading={inventory.loading}
        busyItemId={inventory.busyItemId}
        onAdjust={inventory.adjust}
        onDelete={inventory.remove}
      />
    </main>
  )
}
