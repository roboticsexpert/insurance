import { useNavigate, useRouteError } from 'react-router'
import { ErrorState } from '../components/ErrorState'

/**
 * The last line of defence: whatever a route throws while rendering lands here.
 *
 * There was no boundary anywhere in the app, so a single bad read during render — `CheckoutPage`
 * formatting an `endDate` that a motor or home-fire quote does not have — took the whole screen
 * white, with no message, no way back, and nothing in the UI to say what happened. That specific
 * bug is fixed at its source; this exists so the next one costs a customer an apology rather
 * than the session.
 *
 * Deliberately vague about the cause. A React error message is not a sentence to show someone
 * mid-purchase, and the console already has the real one.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  if (import.meta.env.DEV) console.error('Route error boundary caught:', error)

  return (
    <div className="min-h-dvh bg-page pt-16">
      <div className="mx-auto w-full max-w-[430px]">
        <ErrorState
          title="این صفحه باز نشد"
          message="مشکلی در نمایش این صفحه پیش آمد. اگر در میانه خرید بودید، مبلغی کسر نشده است."
          onRetry={() => navigate('/', { replace: true })}
          actionLabel="بازگشت به خانه"
        />
      </div>
    </div>
  )
}
