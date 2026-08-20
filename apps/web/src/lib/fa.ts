/**
 * Display helpers. Deliberately duplicated from the API rather than shared through a package —
 * forty frozen lines beat a cross-package build step.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

export const toPersianDigits = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] as string)

export const toLatinDigits = (input: string): string =>
  input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

const groupDigits = (n: number): string =>
  Math.trunc(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '٬')

/** Money reaches the UI as Rial and is always shown as Toman, never as a bare number. */
export const formatToman = (rial: number, opts: { withUnit?: boolean } = {}): string => {
  const body = toPersianDigits(groupDigits(Math.round(rial / 10)))
  return opts.withUnit === false ? body : `${body} تومان`
}

/**
 * One decimal place, Persian separator, and no trailing `٫۰` — «۴۰۰ میلیون» is how the number
 * is said out loud, while «۴۰۰٫۰ میلیون» reads like a measurement.
 */
const decimal = (n: number): string =>
  toPersianDigits(n.toFixed(1).replace(/\.0$/, '')).replace('.', '٫')

export const formatTomanCompact = (rial: number): string => {
  const toman = Math.round(rial / 10)
  if (toman >= 1_000_000_000) return `${decimal(toman / 1e9)} میلیارد تومان`
  if (toman >= 1_000_000) return `${decimal(toman / 1e6)} میلیون تومان`
  if (toman >= 1_000) return `${toPersianDigits(Math.round(toman / 1e3))} هزار تومان`
  return `${toPersianDigits(toman)} تومان`
}

/*
 * Jalali dates come from Intl, not a date library. `fa-IR-u-ca-persian` is built into every
 * browser this app targets, returns Persian digits already, and cannot drift out of date.
 *
 * **Formatted in UTC on purpose.** Every date the API sends is date-only in meaning — a policy
 * ends at `…T23:59:59Z`, which is the *same day* everywhere. Formatting in local time rolls
 * that to the next day east of Greenwich, so the app said «تا ۲۱ مهر» while the policy document
 * (rendered server-side in UTC) said «۲۰ مهر». Same policy, two different end dates.
 */
const jalaliLong = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

const jalaliShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
})

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value))

/** `۲۹ مرداد ۱۴۰۵` */
export const formatJalali = (value: Date | string): string => jalaliLong.format(toDate(value))

/** `۰۵/۰۵/۲۹` — for dense rows where the long form does not fit. */
export const formatJalaliShort = (value: Date | string): string => jalaliShort.format(toDate(value))

/** `۰۹۱۲ ۳۴۵ ۶۷۸۹` from the API's canonical `9123456789`. */
export const formatMobile = (canonical: string): string => {
  const m = `0${canonical}`
  return toPersianDigits(`${m.slice(0, 4)} ${m.slice(4, 7)} ${m.slice(7)}`)
}

/** `۲:۰۵` — for the OTP resend timer and the quote expiry countdown. */
export const formatCountdown = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds))
  return toPersianDigits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
}

/**
 * Calendar days from `now` until `value`, both reduced to their UTC date first — for the same
 * reason dates are *formatted* in UTC above. Subtracting the raw timestamps instead would
 * measure the part-day left over from the current clock time: a policy ending at `23:59:59`
 * on a date twelve days out is «۱۲ روز» to its owner, not the twelve-and-a-bit that rounds
 * up to thirteen.
 */
const utcMidnight = (d: Date): number => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())

export const daysUntil = (value: Date | string, now: Date = new Date()): number =>
  Math.round((utcMidnight(toDate(value)) - utcMidnight(now)) / 86_400_000)
