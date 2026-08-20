import { useState } from 'react'
import {
  currentJalaliYear,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  JALALI_MONTHS,
} from '../../lib/jalali'
import { toLatinDigits, toPersianDigits } from '../../lib/fa'

const inputClass =
  'w-full rounded-2xl border bg-card px-3 py-3.5 text-center text-base text-strong outline-none transition-colors placeholder:text-muted/50 focus:border-brand-500'

/**
 * Day / month / year, not a text field with separators.
 *
 * Iranians write dates as ۱۳۶۹/۰۳/۰۲, but parsing free text on a phone keyboard means fighting
 * separators and digit systems for no benefit. Three controls cannot be typed wrong, and the
 * month is a list because month *names* are what people actually remember.
 */
export function JalaliDateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  /** Gregorian `YYYY-MM-DD`, or null while the date is incomplete. */
  value: string | null
  onChange: (iso: string | null) => void
  error?: string
}) {
  const initial = value ? isoToJalali(value) : null
  const [jy, setJy] = useState(initial ? String(initial.jy) : '')
  const [jm, setJm] = useState(initial ? String(initial.jm) : '')
  const [jd, setJd] = useState(initial ? String(initial.jd) : '')

  const emit = (y: string, m: string, d: string) => {
    const [ny, nm, nd] = [Number(y), Number(m), Number(d)]
    if (!y || !m || !d) return onChange(null)
    onChange(jalaliToIso(ny, nm, nd))
  }

  const maxDay = jy && jm ? jalaliMonthLength(Number(jy), Number(jm)) : 31
  const digitsOnly = (raw: string, max: number) =>
    toLatinDigits(raw).replace(/\D/g, '').slice(0, max)

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-strong">{label}</span>
      <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
        <input
          inputMode="numeric"
          aria-label="روز"
          placeholder="روز"
          value={toPersianDigits(jd)}
          onChange={(e) => {
            const next = digitsOnly(e.target.value, 2)
            setJd(next)
            emit(jy, jm, next)
          }}
          className={`${inputClass} ${error ? 'border-red-500' : 'border-line'}`}
        />
        <select
          aria-label="ماه"
          value={jm}
          onChange={(e) => {
            const next = e.target.value
            setJm(next)
            // Esfand 30 exists only in leap years, so a month change can invalidate the day.
            const clamped =
              jd && Number(jd) > jalaliMonthLength(Number(jy || currentJalaliYear()), Number(next))
                ? ''
                : jd
            setJd(clamped)
            emit(jy, next, clamped)
          }}
          className={`${inputClass} appearance-none ${error ? 'border-red-500' : 'border-line'} ${
            jm ? '' : 'text-muted/60'
          }`}
        >
          <option value="">ماه</option>
          {JALALI_MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <input
          inputMode="numeric"
          aria-label="سال"
          placeholder="سال"
          value={toPersianDigits(jy)}
          onChange={(e) => {
            const next = digitsOnly(e.target.value, 4)
            setJy(next)
            emit(next, jm, jd)
          }}
          className={`${inputClass} ${error ? 'border-red-500' : 'border-line'}`}
        />
      </div>
      {jd && Number(jd) > maxDay ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          این ماه {toPersianDigits(maxDay)} روز دارد.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
