const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

/** Mirrors the API's error envelope. The UI prints `messageFa` and branches on `code`. */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly messageFa: string
  readonly fields?: Record<string, string>
  readonly requestId?: string

  constructor(payload: {
    statusCode: number
    code: string
    messageFa: string
    fields?: Record<string, string>
    requestId?: string
  }) {
    super(`${payload.code} (${payload.statusCode})`)
    this.name = 'ApiError'
    this.statusCode = payload.statusCode
    this.code = payload.code
    this.messageFa = payload.messageFa
    this.fields = payload.fields
    this.requestId = payload.requestId
  }
}

const NETWORK_ERROR_FA = 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.'

let accessToken: string | null = null

/** Held in memory only — a refresh token in an httpOnly cookie restores the session. */
export const setAccessToken = (token: string | null): void => {
  accessToken = token
}
export const getAccessToken = (): string | null => accessToken

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** Set false on the auth endpoints themselves, so a failed refresh cannot recurse. */
  retryOnUnauthorized?: boolean
  /** Set true only for the refresh call itself, which must not wait on its own bootstrap. */
  skipSessionWait?: boolean
}

type SessionListener = (user: unknown | null) => void
const sessionListeners = new Set<SessionListener>()

/** The auth store subscribes here, so a silent refresh updates React state too. */
export function onSessionChange(listener: SessionListener): () => void {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

let refreshInFlight: Promise<boolean> | null = null

/**
 * Trades the refresh cookie for a new access token.
 *
 * **Single-flight on purpose.** The API treats a refresh token as single-use and revokes the
 * entire token family if one is presented twice — so two components hitting 401 at the same
 * moment and both refreshing would look exactly like a stolen-token replay and log the user
 * out. Every caller waits on the same promise.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const data = await apiFetch<{ accessToken: string; user: unknown }>('/auth/refresh', {
        method: 'POST',
        retryOnUnauthorized: false,
        skipSessionWait: true,
      })
      accessToken = data.accessToken
      for (const listener of sessionListeners) listener(data.user)
      return true
    } catch {
      accessToken = null
      for (const listener of sessionListeners) listener(null)
      return false
    } finally {
      // Cleared in a microtask so concurrent callers all observe the same result first.
      queueMicrotask(() => {
        refreshInFlight = null
      })
    }
  })()

  return refreshInFlight
}

/**
 * Restoring the session starts at module load, before any component can render — not in a
 * provider effect.
 *
 * React runs child effects before parent effects, so a query inside the tree fires its request
 * *before* an `AuthProvider` effect could refresh. Those requests went out anonymous, and the
 * API answered exactly as it should: 403 on someone else's quote. Kicking the refresh off here
 * and having every request await it removes the race for good rather than per-query.
 */
export const sessionBootstrap: Promise<boolean> = refreshSession()

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, retryOnUnauthorized = true, skipSessionWait } = options

  // Never let a request race the session restore; a failed restore resolves too.
  if (!skipSessionWait) await sessionBootstrap.catch(() => false)

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // the refresh cookie
      signal: signal ?? null,
      body: body === undefined ? null : JSON.stringify(body),
    })
  } catch (cause) {
    // A thrown fetch is a dead network, not an API response — say so in the user's words.
    throw new ApiError({ statusCode: 0, code: 'NETWORK', messageFa: NETWORK_ERROR_FA, ...{ cause } })
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // The access token lives 15 minutes, so an expired one is routine, not exceptional:
    // refresh once behind the scenes and replay the request before the user notices.
    if (response.status === 401 && retryOnUnauthorized) {
      const refreshed = await refreshSession()
      if (refreshed) return apiFetch<T>(path, { ...options, retryOnUnauthorized: false })
    }

    if (payload && typeof payload === 'object' && 'code' in payload) {
      throw new ApiError(payload as ConstructorParameters<typeof ApiError>[0])
    }
    throw new ApiError({
      statusCode: response.status,
      code: 'INTERNAL',
      messageFa: 'مشکلی در سامانه پیش آمد. لطفاً دوباره تلاش کنید.',
    })
  }

  return payload as T
}

/**
 * Fetches a document rather than JSON — the e-policy is HTML.
 *
 * It cannot be a plain `<a href>`: the route requires an Authorization header, and a link
 * would arrive unauthenticated. The caller turns the result into a blob URL to open or print.
 */
export async function apiFetchText(path: string): Promise<string> {
  await sessionBootstrap.catch(() => false)

  const headers: Record<string, string> = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${BASE_URL}${path}`, { headers, credentials: 'include' })

  if (response.status === 401) {
    const refreshed = await refreshSession()
    if (refreshed) return apiFetchText(path)
  }

  if (!response.ok) {
    throw new ApiError({
      statusCode: response.status,
      code: 'INTERNAL',
      messageFa: 'دریافت بیمه‌نامه ممکن نشد.',
    })
  }

  return response.text()
}

