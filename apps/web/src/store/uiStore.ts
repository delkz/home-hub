import { create } from 'zustand'

type Drawer = 'inventory-item' | null

type UIState = {
  activeDrawer: Drawer
  editingItemId: string | null
  searchQuery: string
  categoryFilter: string
  openNewItem: () => void
  openEditItem: (itemId: string) => void
  closeDrawer: () => void
  setSearchQuery: (query: string) => void
  setCategoryFilter: (categoryId: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeDrawer: null,
  editingItemId: null,
  searchQuery: '',
  categoryFilter: 'all',
  openNewItem: () => set({ activeDrawer: 'inventory-item', editingItemId: null }),
  openEditItem: (editingItemId) => set({ activeDrawer: 'inventory-item', editingItemId }),
  closeDrawer: () => set({ activeDrawer: null, editingItemId: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
}))
