import { PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { InsightsCard } from '../components/dashboard/InsightsCard'
import { InventoryList } from '../components/dashboard/InventoryList'
import { QuickActionCard } from '../components/dashboard/QuickActionCard'
import { StatCard } from '../components/dashboard/StatCard'
import { Card } from '../components/ui/Card'
import type { InventoryController } from '../hooks/useInventory'
import { useUIStore } from '../store/uiStore'

type HomePageProps = {
  inventory: InventoryController
}

export function HomePage({ inventory }: HomePageProps) {
  const openNewItem = useUIStore((state) => state.openNewItem)
  const searchQuery = useUIStore((state) => state.searchQuery)

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const visibleItems = normalizedSearch
    ? inventory.items.filter((item) => `${item.name} ${item.description ?? ''} ${item.unit} ${item.category?.name ?? ''}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : inventory.items

  return (
    <main className="grid gap-5 px-6 pt-7 pb-28 md:grid-cols-12 md:px-0 md:pb-8">
            <Card tone="ai" className="min-h-45 p-6 md:col-span-8">
              <p className="text-xs font-bold text-emerald-700">Casa em dia</p>
              <h1 className="mt-3 text-3xl font-bold">Bom dia, David</h1>
              <p className="mt-2 max-w-lg text-sm text-muted">Resumo rápido do estoque, compras e sinais importantes da casa.</p>
              {inventory.error ? <button type="button" className="mt-4 text-xs font-bold text-rose-700" onClick={() => void inventory.load()}>Falha ao carregar. Tentar novamente</button> : null}
            </Card>

            <div className="md:col-span-4"><InsightsCard /></div>

            <section className="flex gap-3 md:col-span-8 md:gap-4">
              <StatCard value={inventory.summary.total} label="itens" tone="success" />
              <StatCard value={inventory.summary.low} label="baixos" tone="warning" />
              <StatCard value={inventory.summary.empty} label="zerados" tone="danger" />
            </section>

            <section className="md:col-span-4">
              <h2 className="mb-4 text-lg font-bold">Ações rápidas</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionCard title="Novo" caption="inventário" icon={PlusIcon} tone="success" onClick={openNewItem} />
                <QuickActionCard title="Registrar" caption="compra" icon={ShoppingCartIcon} tone="warning" />
              </div>
            </section>

            <section className="md:col-span-8">
              <InventoryList
                items={visibleItems.slice(0, 4)}
                loading={inventory.loading}
                busyItemId={inventory.busyItemId}
                onAdjust={inventory.adjust}
                onDelete={inventory.remove}
                action={<Link className="text-xs font-bold text-primary hover:underline" to="/inventory">Ver todos</Link>}
              />
            </section>
            <Card className="hidden p-8 md:col-span-4 md:block">
              <h2 className="text-lg font-bold">Resumo de compras</h2>
              <p className="mt-2 text-sm text-muted">Itens que precisam de reposição ou atenção.</p>
              <div className="mt-8 grid gap-3 text-sm font-semibold">
                <span>{inventory.summary.low} itens com estoque baixo</span>
                <span>{inventory.summary.empty} itens zerados</span>
                <span>{inventory.summary.ok} itens em dia</span>
              </div>
            </Card>
    </main>
  )
}
