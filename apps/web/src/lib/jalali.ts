/**
 * Jalali ⇄ Gregorian, with `Intl` as the single source of truth.
 *
 * Display already goes through `Intl.DateTimeFormat('fa-IR-u-ca-persian')`. Hand-rolling the
 * inverse conversion would mean two independent implementations of the Persian calendar that
 * can disagree on leap years. Instead the inverse is found by searching Gregorian days and
 * asking `Intl` what each one is — slower, but correct by construction and impossible to drift.
 */

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const

const partsFormatter = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
})

export interface JalaliParts {
  jy: number
  jm: number
  jd: number
}

export function toJalaliParts(date: Date): JalaliParts {
  const parts = partsFormatter.formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN)
  return { jy: get('year'), jm: get('month'), jd: get('day') }
}

const DAY_MS = 86_400_000
const iso = (date: Date): string => date.toISOString().slice(0, 10)

/** Days in a Jalali month — 31 for the first six, 30 for the next five, 29 or 30 for Esfand. */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  // Ask Intl whether Esfand 30 exists in this year rather than guessing at the leap rule.
  return jalaliToIso(jy, 12, 30) ? 30 : 29
}

/** Returns `YYYY-MM-DD` (Gregorian), or null when that Jalali date does not exist. */
export function jalaliToIso(jy: number, jm: number, jd: number): string | null {
  if (!Number.isInteger(jy) || jm < 1 || jm > 12 || jd < 1 || jd > 31) return null

  // 1 Farvardin lands on or about 21 March of (jy + 621); start a little before it.
  const anchor = Date.UTC(jy + 621, 2, 16)
  const approximateOffset = Math.floor((jm - 1) * 30.5 + jd)

  // A ±20 day window around the estimate absorbs leap years and the 31/30 month split.
  for (let delta = -20; delta <= 20; delta++) {
    const candidate = new Date(anchor + (approximateOffset + delta) * DAY_MS)
    const parts = toJalaliParts(candidate)
    if (parts.jy === jy && parts.jm === jm && parts.jd === jd) return iso(candidate)
  }
  return null
}

export function isoToJalali(isoDate: string): JalaliParts | null {
  const time = Date.parse(`${isoDate}T00:00:00Z`)
  return Number.isNaN(time) ? null : toJalaliParts(new Date(time))
}

/** The current Jalali year, for bounding a birth-year input. */
export const currentJalaliYear = (): number => toJalaliParts(new Date()).jy
