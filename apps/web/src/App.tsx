import { Navigate, Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/dashboard/AppHeader'
import { BottomNavigation } from './components/dashboard/BottomNavigation'
import { MovementDrawer } from './components/dashboard/MovementDrawer'
import { MovementHistoryDrawer } from './components/dashboard/MovementHistoryDrawer'
import { NewItemDrawer } from './components/dashboard/NewItemDrawer'
import { PurchaseDrawer } from './components/dashboard/PurchaseDrawer'
import { Sidebar } from './components/dashboard/Sidebar'
import { useInventory } from './hooks/useInventory'
import { HomePage } from './pages/HomePage'
import { InventoryPage } from './pages/InventoryPage'
import { ProfilePage } from './pages/ProfilePage'
import { useUIStore } from './store/uiStore'

function App() {
  const inventory = useInventory()
  const editingItemId = useUIStore((state) => state.editingItemId)
  const movementItemId = useUIStore((state) => state.movementItemId)
  const movementType = useUIStore((state) => state.movementType)
  const editingItem = inventory.items.find((item) => item.id === editingItemId)
  const movementItem = inventory.items.find((item) => item.id === movementItemId)

  return (
    <div className="min-h-screen bg-app p-0 lg:p-6">
      <div className="mx-auto flex max-w-360 gap-7">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <AppHeader />
          <Routes>
            <Route path="/" element={<HomePage inventory={inventory} />} />
            <Route path="/inventory" element={<InventoryPage inventory={inventory} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      <BottomNavigation />
      <NewItemDrawer key={editingItem?.id ?? 'new-item'} item={editingItem} categories={inventory.categories} saving={inventory.saving} error={inventory.mutationError} onSubmit={inventory.save} />
      <MovementDrawer key={`${movementItemId}-${movementType}`} items={inventory.items} saving={inventory.movementSaving} error={inventory.mutationError} onSubmit={inventory.recordMovement} />
      <MovementHistoryDrawer key={movementItemId ?? 'movement-history'} item={movementItem} onLoad={inventory.listMovements} />
      <PurchaseDrawer items={inventory.items} saving={inventory.purchaseSaving} error={inventory.mutationError} onSubmit={inventory.recordPurchase} />
    </div>
  )
}

export default App
