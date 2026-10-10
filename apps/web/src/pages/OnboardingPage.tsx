import { useState, type FormEvent } from 'react'
import type { AuthUser } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { apiFetch } from '../infrastructure/apiClient'

const MIN_PASSWORD_LENGTH = 10

type OnboardingPageProps = {
  requiresToken: boolean
  onDone: (user: AuthUser) => void
  onAlreadySetUp: () => void
}

export function OnboardingPage({ requiresToken, onDone, onAlreadySetUp }: OnboardingPageProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', houseName: '', setupToken: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }
    if (form.password !== form.confirmPassword) {
      return setError('As senhas não conferem.')
    }

    setSubmitting(true)
    try {
      const response = await apiFetch('/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          houseName: form.houseName,
          setupToken: form.setupToken,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (response.status === 409) return onAlreadySetUp()
      if (!response.ok) throw new Error(body.message || 'Não foi possível criar sua conta.')
      onDone(body.user)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível criar sua conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-app p-6">
      <Card className="glass w-full max-w-md p-8">
        <img src="/logo.svg" alt="Home Hub" className="mx-auto mb-6 h-9 w-auto" />
        <div className="mb-7 text-center">
          <p className="text-3xl" aria-hidden="true">🏡</p>
          <h1 className="mt-2 text-2xl font-bold">Bem-vindo ao Home Hub!</h1>
          <p className="mt-2 text-sm text-muted">Vamos criar sua conta. Ela será a conta principal da casa e só você terá acesso aos dados.</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input id="setup-name" label="Seu nome" autoComplete="name" required maxLength={120} value={form.name} onChange={update('name')} />
          <Input id="setup-email" label="E-mail" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
          <Input id="setup-password" label={`Senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`} type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={form.password} onChange={update('password')} />
          <Input id="setup-confirm" label="Confirme a senha" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={update('confirmPassword')} />
          <Input id="setup-house" label="Nome da casa (opcional)" placeholder="Ex.: Casa da praia" maxLength={255} value={form.houseName} onChange={update('houseName')} />
          {requiresToken && (
            <Input id="setup-token" label="Código de configuração" autoComplete="off" required value={form.setupToken} onChange={update('setupToken')} />
          )}
          {error && <p role="alert" className="rounded-control bg-danger-soft px-4 py-3 text-sm text-rose-700">{error}</p>}
          <Button type="submit" className="mt-2 min-h-12" disabled={submitting}>{submitting ? 'Criando sua conta…' : 'Criar conta e começar'}</Button>
        </form>
      </Card>
    </main>
  )
}
