import { useOnline } from '../app/use-online'
import { OfflineIcon } from './icons'

/**
 * Says «you are offline» once, at the top of the frame, instead of leaving the customer to
 * infer it from four screens that each failed differently.
 *
 * It sits above the scrolling content rather than floating over it: a bar that covers the
 * header is a bar people dismiss without reading. It also never blocks anything — the app
 * still works offline as far as the cached shell allows, and a stale banner on a flaky
 * connection must not stand between a customer and a button.
 */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-amber-950"
    >
      <OfflineIcon className="h-4 w-4 shrink-0" />
      اینترنت در دسترس نیست — قیمت‌ها و بیمه‌نامه‌ها به‌روز نمی‌شوند.
    </div>
  )
}
