// Utilities to handle safe returnTo redirects to prevent open redirect attacks

const allowedInternalPaths = [
  '/',
  '/login',
  '/lobby',
  '/game',
]

export function isAllowedInternalPath(path) {
  if (typeof path !== 'string') return false
  if (!path.startsWith('/')) return false
  try {
    const url = new URL(path, window.location.origin)
    return allowedInternalPaths.some(p => url.pathname === p)
  } catch {
    return false
  }
}

export function sanitizeReturnTo(returnTo) {
  if (!returnTo) return null
  try {
    const url = new URL(returnTo, window.location.origin)
    const sameOrigin = url.origin === window.location.origin
    if (sameOrigin && isAllowedInternalPath(url.pathname)) {
      return url.pathname + (url.search || '') + (url.hash || '')
    }
    return null
  } catch {
    return null
  }
}

export function getReturnToFromQuery() {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('returnTo')
  return sanitizeReturnTo(raw)
}

export function persistReturnTo(value) {
  if (!value) return
  const safe = sanitizeReturnTo(value)
  if (safe) {
    try { localStorage.setItem('authReturnTo', safe) } catch {}
  }
}

export function consumePersistedReturnTo() {
  try {
    const raw = localStorage.getItem('authReturnTo')
    if (!raw) return null
    const safe = sanitizeReturnTo(raw)
    localStorage.removeItem('authReturnTo')
    return safe
  } catch {
    return null
  }
}
