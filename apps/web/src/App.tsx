import { Navigate, Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/dashboard/AppHeader'
import { BottomNavigation } from './components/dashboard/BottomNavigation'
import { NewItemDrawer } from './components/dashboard/NewItemDrawer'
import { Sidebar } from './components/dashboard/Sidebar'
import { useInventory } from './hooks/useInventory'
import { HomePage } from './pages/HomePage'
import { InventoryPage } from './pages/InventoryPage'
import { useUIStore } from './store/uiStore'

function App() {
  const inventory = useInventory()
  const editingItemId = useUIStore((state) => state.editingItemId)
  const editingItem = inventory.items.find((item) => item.id === editingItemId)

  return (
    <div className="min-h-screen bg-app p-0 lg:p-6">
      <div className="mx-auto flex max-w-360 gap-7">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <AppHeader />
          <Routes>
            <Route path="/" element={<HomePage inventory={inventory} />} />
            <Route path="/inventory" element={<InventoryPage inventory={inventory} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      <BottomNavigation />
      <NewItemDrawer key={editingItem?.id ?? 'new-item'} item={editingItem} saving={inventory.saving} error={inventory.mutationError} onSubmit={inventory.save} />
    </div>
  )
}

export default App
