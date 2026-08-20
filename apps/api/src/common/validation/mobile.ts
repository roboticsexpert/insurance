import { toLatinDigits } from '../fa'

/**
 * Canonical mobile form used everywhere in the system: `9XXXXXXXXX` (10 digits, no leading 0).
 * Accepts what users actually type: 09123456789, +989123456789, ۰۹۱۲..., 00989...
 */
export function normalizeMobile(input: string): string | null {
  let d = toLatinDigits(input).replace(/[^\d+]/g, '')
  if (d.startsWith('+98')) d = d.slice(3)
  else if (d.startsWith('0098')) d = d.slice(4)
  else if (d.startsWith('98') && d.length === 12) d = d.slice(2)
  else if (d.startsWith('0')) d = d.slice(1)
  d = d.replace(/\D/g, '')
  return /^9\d{9}$/.test(d) ? d : null
}

export const isValidMobile = (input: string): boolean => normalizeMobile(input) !== null

/** `۰۹۱۲ ۳۴۵ ۶۷۸۹` for display. */
export function formatMobileFa(canonical: string): string {
  const m = `0${canonical}`
  return `${m.slice(0, 4)} ${m.slice(4, 7)} ${m.slice(7)}`.replace(/[0-9]/g, (x) =>
    String.fromCharCode(0x06f0 + Number(x)),
  )
}
