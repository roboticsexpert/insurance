import { useId } from 'react'
import { formatTomanCompact, toLatinDigits, toPersianDigits } from '../../lib/fa'

/**
 * Money in **Toman**, stored in Rial.
 *
 * Nobody in Iran says a number in Rial out loud, so the field asks for Toman and multiplies by
 * ten on the way out — the same ÷10 the rest of the UI applies on the way in. The value is
 * grouped as it is typed, because an unseparated ۲۵۰۰۰۰۰۰۰۰ is unreadable and a customer
 * insuring their home for the wrong power of ten will not notice until a claim.
 *
 * A compact echo («۲٫۵ میلیارد تومان») sits under the field for exactly that reason: it is the
 * only representation that makes a stray zero obvious at a glance.
 */
export function MoneyField({
  label,
  hint,
  /** Rial, or null while empty. */
  value,
  onChange,
  placeholderToman,
}: {
  label: string
  hint?: string
  value: number | null
  onChange: (rial: number | null) => void
  placeholderToman?: string
}) {
  const id = useId()
  const toman = value === null ? '' : Math.round(value / 10)

  const grouped =
    toman === '' ? '' : toPersianDigits(String(toman).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'))

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-strong">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={grouped}
          placeholder={placeholderToman}
          onChange={(event) => {
            const digits = toLatinDigits(event.target.value).replace(/\D/g, '')
            // 15 digits of Toman is more money than exists; the cap stops a stuck key from
            // overflowing the integer the API expects.
            onChange(digits === '' ? null : Number(digits.slice(0, 15)) * 10)
          }}
          className="w-full rounded-2xl border border-line bg-card py-3.5 pl-16 pr-4 text-base tabular-nums text-strong outline-none transition-colors placeholder:text-muted/50 focus:border-brand-500"
        />
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-muted">
          تومان
        </span>
      </div>

      {value !== null && value > 0 ? (
        <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">
          {formatTomanCompact(value)}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs leading-6 text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
