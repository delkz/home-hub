import { createContext, useContext } from 'react'

export type Pronouns = 'he' | 'she'

export type AuthUser = { id: string; email: string; name: string | null; pronouns: Pronouns }

export type AuthContextValue = {
  user: AuthUser
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthGate>')
  return value
}
