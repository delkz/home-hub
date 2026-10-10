import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch, onUnauthorized } from '../infrastructure/apiClient'
import { LoginPage } from '../pages/LoginPage'
import { AuthContext, type AuthUser } from './AuthContext'

type State = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; user: AuthUser }

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    apiFetch('/auth/me')
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) return setState({ status: 'signed-out' })
        const { user } = await response.json()
        setState({ status: 'signed-in', user })
      })
      .catch(() => !cancelled && setState({ status: 'signed-out' }))

    const stop = onUnauthorized(() => setState({ status: 'signed-out' }))
    return () => {
      cancelled = true
      stop()
    }
  }, [])

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    setState({ status: 'signed-out' })
  }, [])

  const value = useMemo(() => (state.status === 'signed-in' ? { user: state.user, logout } : null), [state, logout])

  if (state.status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Carregando…</div>
  }

  if (!value) {
    return <LoginPage onSignedIn={(user) => setState({ status: 'signed-in', user })} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
