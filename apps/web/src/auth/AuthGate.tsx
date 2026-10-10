import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch, onUnauthorized } from '../infrastructure/apiClient'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { AuthContext, type AuthUser } from './AuthContext'

type State =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'onboarding'; requiresToken: boolean }
  | { status: 'signed-in'; user: AuthUser }

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    apiFetch('/auth/me')
      .then(async (response) => {
        if (cancelled) return
        if (response.ok) {
          const { user } = await response.json()
          return setState({ status: 'signed-in', user })
        }
        const setup = await apiFetch('/auth/setup').then((r) => r.json()).catch(() => null)
        if (cancelled) return
        setState(setup?.needsSetup ? { status: 'onboarding', requiresToken: Boolean(setup.requiresToken) } : { status: 'signed-out' })
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

  if (state.status === 'onboarding') {
    return (
      <OnboardingPage
        requiresToken={state.requiresToken}
        onDone={(user) => setState({ status: 'signed-in', user })}
        onAlreadySetUp={() => setState({ status: 'signed-out' })}
      />
    )
  }

  if (!value) {
    return <LoginPage onSignedIn={(user) => setState({ status: 'signed-in', user })} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
