import { AlertIcon } from './icons'

/**
 * A page-level failure, with the way out attached.
 *
 * Three screens previously reported a failed fetch through `EmptyState` — which has no action —
 * so a customer whose policies did not load had nothing to tap and no way to recover but to
 * guess at the tab bar. An error a person cannot retry is a dead end, so the retry is part of
 * the component rather than something each caller remembers to pass.
 *
 * The message is the API's `messageFa` wherever there is one: the API owns Persian wording, and
 * a generic «خطایی رخ داد» throws away a sentence that was written to be read.
 */
export function ErrorState({
  title = 'دریافت اطلاعات ممکن نشد',
  message,
  onRetry,
  retrying,
  actionLabel = 'تلاش دوباره',
}: {
  title?: string
  message: string
  onRetry?: () => void
  retrying?: boolean
  /** Override when the action is not a retry — a button that lies about where it goes is worse
      than no button. */
  actionLabel?: string
}) {
  return (
    <div
      role="alert"
      className="mx-5 flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card px-6 py-10 text-center"
    >
      <AlertIcon className="h-12 w-12 text-muted/50" />
      <p className="text-base font-semibold text-strong">{title}</p>
      <p className="text-sm leading-7 text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-2 min-h-[44px] rounded-full bg-brand-600 px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {retrying ? 'در حال تلاش…' : actionLabel}
        </button>
      ) : null}
    </div>
  )
}
