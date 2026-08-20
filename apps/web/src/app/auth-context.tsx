import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, onSessionChange, sessionBootstrap, setAccessToken } from '../lib/api'
import { queryClient } from './query-client'
import type { AuthResponse, UserDto } from '../lib/auth-api'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: Status
  user: UserDto | null
  signIn: (result: AuthResponse) => void
  signOut: () => Promise<void>
  updateUser: (user: UserDto) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  // A silent refresh keeps the token in memory only: nothing sensitive touches localStorage,
  // so an XSS bug cannot walk off with a 30-day session.
  useEffect(() => {
    let cancelled = false

    const unsubscribe = onSessionChange((next) => {
      if (cancelled) return
      setUser((next as UserDto | null) ?? null)
      setStatus(next ? 'authenticated' : 'anonymous')
    })

    // Awaits the bootstrap already running from module load rather than starting a second
    // refresh — a second one would rotate the token again for no reason.
    void sessionBootstrap.then((ok) => {
      if (!cancelled && !ok) setStatus('anonymous')
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const signIn = useCallback((result: AuthResponse) => {
    setAccessToken(result.accessToken)
    setUser(result.user)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST', retryOnUnauthorized: false })
    } finally {
      // Whatever the server said, this device is signed out.
      setAccessToken(null)
      setUser(null)
      setStatus('anonymous')
      // Cached policies, orders and quotes belong to the user who just left. `enabled: false`
      // only stops the next fetch — without this the cache would still answer reads.
      queryClient.clear()
    }
  }, [])

  const updateUser = useCallback((next: UserDto) => setUser(next), [])

  const value = useMemo(
    () => ({ status, user, signIn, signOut, updateUser }),
    [status, user, signIn, signOut, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
