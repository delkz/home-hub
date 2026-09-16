import { create } from 'zustand'

import type { MovementType } from '../domain/inventory'

type Drawer = 'inventory-item' | 'inventory-movement' | 'movement-history' | 'purchase' | null

type UIState = {
  activeDrawer: Drawer
  editingItemId: string | null
  movementItemId: string | null
  movementType: MovementType
  searchQuery: string
  categoryFilter: string
  openNewItem: () => void
  openEditItem: (itemId: string) => void
  openMovement: (itemId?: string, type?: MovementType) => void
  openPurchase: () => void
  openMovementHistory: (itemId: string) => void
  closeDrawer: () => void
  setSearchQuery: (query: string) => void
  setCategoryFilter: (categoryId: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeDrawer: null,
  editingItemId: null,
  movementItemId: null,
  movementType: 'IN',
  searchQuery: '',
  categoryFilter: 'all',
  openNewItem: () => set({ activeDrawer: 'inventory-item', editingItemId: null }),
  openEditItem: (editingItemId) => set({ activeDrawer: 'inventory-item', editingItemId }),
  openMovement: (movementItemId = '', movementType = 'IN') => set({ activeDrawer: 'inventory-movement', movementItemId, movementType }),
  openPurchase: () => set({ activeDrawer: 'purchase' }),
  openMovementHistory: (movementItemId) => set({ activeDrawer: 'movement-history', movementItemId }),
  closeDrawer: () => set({ activeDrawer: null, editingItemId: null, movementItemId: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
}))
