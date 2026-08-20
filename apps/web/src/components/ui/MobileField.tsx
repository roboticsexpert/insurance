import { useId } from 'react'
import { toLatinDigits, toPersianDigits } from '../../lib/fa'

/**
 * Phone number entry.
 *
 * The value is held in Latin digits (what the API wants) and rendered in Persian digits (what
 * every other number in this app looks like). The mapping is 1:1 with no separators, so the
 * string length never changes and the caret does not jump when editing mid-number.
 */
export function MobileField({
  value,
  onChange,
  onBlur,
  error,
  autoFocus,
}: {
  value: string
  onChange: (next: string) => void
  onBlur?: () => void
  error?: string
  autoFocus?: boolean
}) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-strong">
        شماره موبایل
      </label>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        autoFocus={autoFocus}
        onBlur={onBlur}
        dir="ltr"
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        value={toPersianDigits(value)}
        onChange={(event) =>
          onChange(toLatinDigits(event.target.value).replace(/\D/g, '').slice(0, 11))
        }
        className={`w-full rounded-2xl border bg-card px-4 py-3.5 text-center text-lg tracking-[0.18em] text-strong outline-none transition-colors placeholder:text-muted/50 focus:border-brand-500 ${
          error ? 'border-red-500' : 'border-line'
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
