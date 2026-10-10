export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const UNAUTHORIZED_EVENT = 'homehub:unauthorized'

// Every API call goes through here: it sends the session cookie and the CSRF header
// the API requires, and broadcasts 401s so the app can return to the login screen.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-Requested-With', 'HomeHub')

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'same-origin' })

  if (response.status === 401 && !path.startsWith('/auth/')) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }

  return response
}

export function onUnauthorized(handler: () => void) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
}
