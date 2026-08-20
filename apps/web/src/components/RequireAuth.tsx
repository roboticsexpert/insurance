import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../app/auth-context'

/**
 * Two gates in one: signed in, and — unless told otherwise — profile complete.
 *
 * `requireCompleteProfile` must be false on the completion screen itself, or the redirect
 * chases its own tail.
 */
export function RequireAuth({
  children,
  requireCompleteProfile = true,
}: {
  children: ReactNode
  requireCompleteProfile?: boolean
}) {
  const { status, user } = useAuth()
  const location = useLocation()

  // The session is restored from a cookie on load, so "not signed in yet" and "signed out"
  // look identical for a moment. Redirecting during that moment would bounce a signed-in user
  // to the login screen on every refresh.
  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-600" />
      </div>
    )
  }

  // `from` is carried through login *and* profile completion, so someone who taps "buy" and
  // has to sign in lands back on checkout rather than on the home screen.
  const from = location.pathname + location.search

  if (!user) return <Navigate to="/auth" state={{ from }} replace />

  if (requireCompleteProfile && !user.isProfileComplete) {
    return <Navigate to="/auth/profile" state={{ from }} replace />
  }

  return <>{children}</>
}
