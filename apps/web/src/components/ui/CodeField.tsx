import { useId } from 'react'
import { toLatinDigits, toPersianDigits } from '../../lib/fa'

/**
 * One input rather than four boxes.
 *
 * `autocomplete="one-time-code"` is what makes iOS and Android offer the code straight from
 * the SMS, and that only works reliably on a single field — which is also why the OTP is sent
 * in Latin digits. Four separate boxes look nicer and cost the user the one-tap autofill.
 */
export function CodeField({
  value,
  onChange,
  length,
  error,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  length: number
  error?: string
  disabled?: boolean
}) {
  const id = useId()

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={disabled}
        dir="ltr"
        maxLength={length}
        aria-label="کد تأیید"
        aria-invalid={error ? true : undefined}
        placeholder={toPersianDigits('0'.repeat(length))}
        value={toPersianDigits(value)}
        onChange={(event) =>
          onChange(toLatinDigits(event.target.value).replace(/\D/g, '').slice(0, length))
        }
        className={`w-full rounded-2xl border bg-card py-4 text-center text-2xl font-semibold tracking-[0.6em] text-strong outline-none transition-colors placeholder:text-muted/30 focus:border-brand-500 disabled:opacity-60 ${
          error ? 'border-red-500' : 'border-line'
        }`}
      />
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
