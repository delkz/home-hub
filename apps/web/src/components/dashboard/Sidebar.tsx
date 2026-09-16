import { HomeIcon, PlusIcon, SparklesIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'

const links = [
  { label: 'Início', caption: 'Overview geral', icon: HomeIcon, to: '/' },
  { label: 'Novo item', caption: 'Cadastrar estoque', icon: PlusIcon },
  { label: 'Estoque', caption: 'Lista completa', icon: ArchiveBoxIcon, to: '/inventory' },
  { label: 'Insights IA', caption: 'Previsões e alertas', icon: SparklesIcon },
]

export function Sidebar() {
  const openNewItem = useUIStore((state) => state.openNewItem)
  return (
    <aside className="glass hidden min-h-[calc(100vh-3rem)] w-66 shrink-0 rounded-panel p-5 lg:flex lg:flex-col">
      <div className="mb-10 flex items-center gap-3 px-1">
        <span className="grid size-11 place-items-center rounded-control bg-blue-100 text-primary"><SparklesIcon className="size-6" /></span>
        <div><p className="font-bold">Home Hub</p><p className="text-xs text-muted">Inventário doméstico</p></div>
      </div>

      <nav className="grid gap-1">
        {links.map(({ label, caption, icon: Icon, to }, index) => to ? (
          <NavLink key={label} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-control px-4 py-3 text-left ${isActive ? 'border border-indigo-200 bg-indigo-100' : 'hover:bg-surface-muted'}`}>
            {({ isActive }) => <><Icon className={`size-5 ${isActive ? 'text-primary' : 'text-slate-600'}`} /><span><span className="block text-sm font-bold">{label}</span><span className="block text-xs text-muted">{caption}</span></span></>}
          </NavLink>
        ) : (
          <button key={label} type="button" onClick={index === 1 ? openNewItem : undefined} className="flex items-center gap-3 rounded-control px-4 py-3 text-left hover:bg-surface-muted">
            <Icon className="size-5 text-slate-600" /><span><span className="block text-sm font-bold">{label}</span><span className="block text-xs text-muted">{caption}</span></span>
          </button>
        ))}
      </nav>

      <Button className="mt-8 w-full justify-start" icon={<PlusIcon className="size-5" />} onClick={openNewItem}>Novo inventário</Button>
    </aside>
  )
}
