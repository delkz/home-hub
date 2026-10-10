import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { apiFetch, onUnauthorized } from '../infrastructure/apiClient'
import { LoginPage } from '../pages/LoginPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { AuthContext, type AuthUser } from './AuthContext'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'signed-out' }
  | { status: 'onboarding'; requiresToken: boolean }
  | { status: 'signed-in'; user: AuthUser }

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    apiFetch('/auth/me')
      .then(async (response) => {
        if (cancelled) return
        if (response.ok) {
          const { user } = await response.json()
          return setState({ status: 'signed-in', user })
        }
        if (response.status !== 401) throw new Error('Unexpected response')
        const setupResponse = await apiFetch('/auth/setup')
        if (!setupResponse.ok) throw new Error('Unexpected response')
        const setup = await setupResponse.json()
        if (cancelled) return
        setState(setup.needsSetup ? { status: 'onboarding', requiresToken: Boolean(setup.requiresToken) } : { status: 'signed-out' })
      })
      .catch(() => !cancelled && setState({ status: 'error' }))

    const stop = onUnauthorized(() => setState({ status: 'signed-out' }))
    return () => {
      cancelled = true
      stop()
    }
  }, [attempt])

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    setState({ status: 'signed-out' })
  }, [])

  const updateUser = useCallback((user: AuthUser) => setState({ status: 'signed-in', user }), [])

  const value = useMemo(
    () => (state.status === 'signed-in' ? { user: state.user, logout, updateUser } : null),
    [state, logout, updateUser],
  )

  if (state.status === 'loading' || state.status === 'error') {
    const failed = state.status === 'error'
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
        <img src="/logo.svg" alt="Home Hub" className="h-9" />
        <p role={failed ? 'alert' : 'status'} className="text-sm text-muted">
          {failed ? 'Não foi possível conectar ao servidor. Confira a conexão.' : 'Preparando sua casa…'}
        </p>
        {failed && <Button onClick={() => { setState({ status: 'loading' }); setAttempt((value) => value + 1) }}>Tentar novamente</Button>}
      </main>
    )
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
