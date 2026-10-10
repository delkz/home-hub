import { useState, type FormEvent } from 'react'
import type { AuthUser } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { apiFetch } from '../infrastructure/apiClient'

export function LoginPage({ onSignedIn }: { onSignedIn: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Não foi possível entrar.')
      onSignedIn(body.user)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-app p-6">
      <Card className="glass w-full max-w-sm p-8">
        <img src="/logo.svg" alt="Home Hub" className="mx-auto mb-8 h-9 w-auto" />
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input id="login-email" label="E-mail" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input id="login-password" label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p role="alert" className="rounded-control bg-danger-soft px-4 py-3 text-sm text-rose-700">{error}</p>}
          <Button type="submit" className="mt-2 min-h-12" disabled={submitting}>{submitting ? 'Entrando…' : 'Entrar'}</Button>
        </form>
      </Card>
    </main>
  )
}
