import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import type { AuthUser, Pronouns } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { apiFetch } from '../infrastructure/apiClient'

const MIN_PASSWORD_LENGTH = 10
const titles = ['Bem-vindo ao Home Hub. Qual é o seu nome?', 'Como gostaria de ser tratado?', 'Agora crie seu acesso']
const icons = [HomeIcon, UserCircleIcon, LockClosedIcon]

type OnboardingPageProps = {
  requiresToken: boolean
  onDone: (user: AuthUser) => void
  onAlreadySetUp: () => void
}

export function OnboardingPage({ requiresToken, onDone, onAlreadySetUp }: OnboardingPageProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [pronouns, setPronouns] = useState<Pronouns | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [setupToken, setSetupToken] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const pending = useRef(false)
  const Icon = icons[step]

  useEffect(() => { heading.current?.focus() }, [step])

  function goTo(next: number) { setError(''); setStep(next) }

  async function finish() {
    if (pending.current || !pronouns) return
    if (password.length < MIN_PASSWORD_LENGTH) { setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`); return }
    if (password !== confirmation) { setError('As senhas não coincidem. Confira a confirmação.'); return }

    pending.current = true
    setSaving(true)
    setError('')
    try {
      const response = await apiFetch('/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pronouns, email, password, setupToken }),
      })
      const body = await response.json().catch(() => ({}))
      if (response.status === 409) return onAlreadySetUp()
      if (!response.ok) throw new Error(body.message || 'Não foi possível criar sua conta. Tente novamente.')
      onDone(body.user)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar sua conta. Tente novamente.')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (step === 0) {
      if (!name.trim()) { setError('Digite seu nome para continuar.'); return }
      goTo(1)
    } else if (step === 1) {
      if (!pronouns) { setError('Escolha uma forma de tratamento.'); return }
      goTo(2)
    } else { void finish() }
  }

  const description = step === 0
    ? 'Sua casa, do seu jeito. Vamos começar com uma apresentação.'
    : step === 1
      ? `${name.trim()}, escolha como vamos nos referir a você no app.`
      : 'Com este e-mail e senha você entra no Home Hub de qualquer lugar. Só você terá acesso aos dados.'

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-app px-5 py-8 sm:py-12">
      <img src="/logo.svg" alt="Home Hub" className="mb-8 h-9 w-auto" />
      <section className="w-full max-w-lg rounded-panel border border-line bg-surface p-6 shadow-glass sm:p-10" aria-labelledby="onboarding-title">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-xs font-bold text-muted" aria-live="polite">PASSO {step + 1} DE 3</p>
          <ol className="flex gap-2" aria-label="Progresso do cadastro">
            {['Nome', 'Tratamento', 'Acesso'].map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} aria-label={label} className={`h-1.5 w-9 rounded-full ${index <= step ? 'bg-primary' : 'bg-line'}`} />)}
          </ol>
        </div>
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-ai text-primary"><Icon className="size-7" aria-hidden="true" /></div>
        <h1 ref={heading} tabIndex={-1} id="onboarding-title" className="text-2xl leading-tight font-bold outline-none sm:text-3xl">{titles[step]}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        <form onSubmit={submit} className="mt-7 grid gap-5">
          <fieldset disabled={saving} className="grid min-w-0 gap-4">
            <legend className="sr-only">{titles[step]}</legend>
            {step === 0 && <Input id="profile-name" label="Seu nome" autoComplete="given-name" placeholder="Como você se chama?" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />}
            {step === 1 && <div className="grid gap-3">
              {([{ value: 'he', label: 'Ele/dele', example: 'Bem-vindo à sua casa' }, { value: 'she', label: 'Ela/dela', example: 'Bem-vinda à sua casa' }] as const).map((option) => (
                <label key={option.value} className={`flex cursor-pointer items-center gap-4 rounded-control border p-4 transition-colors ${pronouns === option.value ? 'border-primary bg-ai' : 'border-line bg-surface'}`}>
                  <input type="radio" name="pronouns" value={option.value} checked={pronouns === option.value} onChange={() => setPronouns(option.value)} className="size-5 accent-primary" />
                  <span><span className="block text-sm font-bold">{option.label}</span><span className="mt-1 block text-xs text-muted">{option.example}</span></span>
                </label>
              ))}
            </div>}
            {step === 2 && <>
              <Input id="setup-email" label="E-mail" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input id="setup-password" label={`Senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`} type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              <Input id="setup-confirmation" label="Confirme a senha" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              {requiresToken && <Input id="setup-token" label="Código de configuração" autoComplete="off" required value={setupToken} onChange={(event) => setSetupToken(event.target.value)} />}
            </>}
          </fieldset>
          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
          <div className="flex gap-3">
            {step > 0 && <Button type="button" variant="secondary" disabled={saving} onClick={() => goTo(step - 1)} aria-label="Voltar à etapa anterior" icon={<ArrowLeftIcon className="size-5" />} />}
            <Button type="submit" disabled={saving} className="flex-1" icon={!saving ? <ArrowRightIcon className="size-5" /> : undefined}>{saving ? 'Criando sua conta…' : step === 2 ? 'Criar conta e começar' : 'Continuar'}</Button>
          </div>
        </form>
      </section>
      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-muted">Sua conta fica salva no banco de dados da sua casa, com a senha protegida por hash.</p>
    </main>
  )
}
