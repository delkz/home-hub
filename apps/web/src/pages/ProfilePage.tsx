import { useRef, useState, type FormEvent } from 'react'
import { ArrowRightStartOnRectangleIcon, CheckCircleIcon, LockClosedIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { changePassword, updateProfile } from '../lib/userProfile'

const MIN_PASSWORD_LENGTH = 10

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const [name, setName] = useState(user.name ?? '')
  const [pronouns, setPronouns] = useState(user.pronouns)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const pending = useRef(false)
  const changed = name.trim() !== (user.name ?? '') || pronouns !== user.pronouns

  function reset() {
    setName(user.name ?? ''); setPronouns(user.pronouns); setError(''); setSuccess(false)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current) return
    setError(''); setSuccess(false)
    if (!name.trim()) { setError('Digite seu nome.'); return }
    pending.current = true; setSaving(true)
    try {
      const saved = await updateProfile(name, pronouns)
      updateUser(saved); setName(saved.name ?? ''); setSuccess(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.') }
    finally { pending.current = false; setSaving(false) }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-8 pb-32 lg:px-0">
      <div className="mb-7 flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ai text-primary"><UserCircleIcon className="size-8" /></span>
        <div><h1 className="text-2xl font-bold">Meu perfil</h1><p className="mt-1 text-sm text-muted">Deixe o Home Hub do seu jeito.</p></div>
      </div>
      <form onSubmit={submit} onChange={() => { setSuccess(false); setError('') }} className="grid gap-5">
        <fieldset disabled={saving} className="min-w-0 rounded-panel border border-line bg-surface p-6">
          <legend className="sr-only">Seus dados</legend>
          <h2 className="mb-5 text-lg font-bold">Seus dados</h2>
          <Input id="edit-name" label="Seu nome" autoComplete="given-name" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
          <p className="mt-4 text-sm text-muted">E-mail de acesso: <span className="font-semibold text-ink">{user.email}</span></p>
          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-bold">Como gostaria de ser tratado?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {([{ value: 'he', label: 'Ele/dele' }, { value: 'she', label: 'Ela/dela' }] as const).map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-control border p-4 text-sm font-semibold ${pronouns === option.value ? 'border-primary bg-ai' : 'border-line'}`}><input type="radio" name="pronouns" value={option.value} checked={pronouns === option.value} onChange={() => setPronouns(option.value)} className="size-5 accent-primary" />{option.label}</label>)}
            </div>
          </fieldset>
        </fieldset>
        {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
        {success && <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircleIcon className="size-5" />Perfil atualizado com sucesso.</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" disabled={saving || !changed} onClick={reset}>Descartar alterações</Button>
          <Button type="submit" disabled={saving || !changed}>{saving ? 'Salvando…' : 'Salvar alterações'}</Button>
        </div>
      </form>

      <PasswordSection />

      <div className="mt-5 flex justify-end">
        <Button variant="secondary" icon={<ArrowRightStartOnRectangleIcon className="size-5" />} onClick={() => void logout()}>Sair da conta</Button>
      </div>
    </main>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(''); setSuccess(false)
    if (next.length < MIN_PASSWORD_LENGTH) { setError(`A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`); return }
    if (next !== confirmation) { setError('As senhas não coincidem. Confira a confirmação.'); return }
    setSaving(true)
    try {
      await changePassword(current, next)
      setCurrent(''); setNext(''); setConfirmation(''); setSuccess(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a senha.') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-5">
      <fieldset disabled={saving} className="min-w-0 rounded-panel border border-line bg-surface p-6">
        <legend className="sr-only">Senha de acesso</legend>
        <h2 className="flex items-center gap-2 text-lg font-bold"><LockClosedIcon className="size-5 text-primary" />Senha de acesso</h2>
        <p className="mt-2 text-sm text-muted">Ao trocar a senha, os outros aparelhos conectados saem da conta.</p>
        <div className="mt-5 grid gap-4">
          <Input id="current-password" label="Senha atual" type="password" autoComplete="current-password" required value={current} onChange={(event) => setCurrent(event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="new-password" label={`Nova senha (mínimo ${MIN_PASSWORD_LENGTH})`} type="password" autoComplete="new-password" required value={next} onChange={(event) => setNext(event.target.value)} />
            <Input id="confirm-password" label="Confirme a nova senha" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </div>
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
      {success && <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircleIcon className="size-5" />Senha alterada com sucesso.</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !current || !next}>{saving ? 'Alterando…' : 'Alterar senha'}</Button>
      </div>
    </form>
  )
}
