import { ArchiveBoxIcon, HomeIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

const items = [
  { label: 'Início', icon: HomeIcon, to: '/' },
  { label: 'Novo', icon: PlusIcon },
  { label: 'Estoque', icon: ArchiveBoxIcon, to: '/inventory' },
  { label: 'IA', icon: SparklesIcon },
]

export function BottomNavigation() {
  const openNewItem = useUIStore((state) => state.openNewItem)
  return (
    <nav className="glass fixed inset-x-6 bottom-5 z-30 grid grid-cols-4 rounded-panel p-2 lg:hidden">
      {items.map(({ label, icon: Icon, to }, index) => to ? (
        <NavLink key={label} to={to} end={to === '/'} className={({ isActive }) => `grid min-h-14 place-items-center rounded-control text-xs font-semibold ${isActive ? 'bg-blue-100 text-primary' : 'text-slate-600'}`}>
          <span className="grid justify-items-center gap-1"><Icon className="size-5" />{label}</span>
        </NavLink>
      ) : (
        <button key={label} type="button" onClick={index === 1 ? openNewItem : undefined} className="grid min-h-14 place-items-center rounded-control text-xs font-semibold text-slate-600">
          <span className="grid justify-items-center gap-1"><Icon className="size-5" />{label}</span>
        </button>
      ))}
    </nav>
  )
}
