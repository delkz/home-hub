import type { AuthUser, Pronouns } from '../auth/AuthContext'
import { apiFetch } from '../infrastructure/apiClient'

async function send<T>(path: string, method: string, body: unknown, fallback: string): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || fallback)
  return data
}

export function updateProfile(name: string, pronouns: Pronouns): Promise<AuthUser> {
  return send('/profile', 'PUT', { name: name.trim(), pronouns }, 'Não foi possível salvar as alterações. Tente novamente.')
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await send('/auth/password', 'POST', { currentPassword, newPassword }, 'Não foi possível alterar a senha. Tente novamente.')
}
