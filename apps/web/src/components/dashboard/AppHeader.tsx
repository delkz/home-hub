import { ArrowRightStartOnRectangleIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'

export function AppHeader() {
  const searchQuery = useUIStore((state) => state.searchQuery)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const { user, logout } = useAuth()

  return (
    <header className="glass sticky top-5 z-40 mx-6 grid h-18 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-3 rounded-panel px-4 md:grid-cols-[minmax(10rem,1fr)_minmax(18rem,28rem)_minmax(10rem,1fr)] md:px-6 lg:top-6 lg:mx-0">
      <Button className="col-start-1 row-start-1 size-11 px-0 md:hidden" variant="secondary" aria-label="Abrir menu" icon={<Bars3Icon className="size-5" />} />

      <Link to="/" className="col-start-2 row-start-1 justify-self-center md:col-start-1 md:justify-self-start" aria-label="Ir para o início">
        <img src="/logo.svg" alt="Home Hub" className="h-8 w-auto" />
      </Link>

      <label className="col-start-2 row-start-1 hidden w-full items-center gap-2 rounded-control bg-surface-muted px-4 py-3 text-sm text-muted md:flex">
        <MagnifyingGlassIcon className="size-5" />
        <input className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar itens" aria-label="Buscar itens" />
      </label>

      <Button className="col-start-3 row-start-1 size-11 justify-self-end px-0" variant="secondary" aria-label={`Sair (${user.email})`} title={`Sair (${user.email})`} onClick={() => void logout()} icon={<ArrowRightStartOnRectangleIcon className="size-5" />} />
    </header>
  )
}
