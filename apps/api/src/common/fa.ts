const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] as string)
}

/**
 * A number for display: Persian digits **and** the Persian decimal separator ٫ (U+066B).
 * `toPersianDigits` alone leaves a Latin dot behind, which reads as broken in Persian text —
 * use this for any bare number that might not be an integer.
 */
export function toPersianNumber(value: number | string): string {
  return toPersianDigits(String(value)).replace('.', '٫')
}

export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)) // Persian
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // Arabic-Indic
}

export function groupDigits(n: number): string {
  return Math.trunc(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '٬')
}

/** `۴٬۲۵۰٬۰۰۰ تومان` — the only way money is ever shown to a user. */
export function formatToman(rial: number, opts: { withUnit?: boolean } = {}): string {
  const { withUnit = true } = opts
  const toman = Math.round(rial / 10)
  const body = toPersianDigits(groupDigits(toman))
  return withUnit ? `${body} تومان` : body
}

/** Persian uses ٫ as the decimal separator, not a Latin dot. */
const decimal = (n: number): string => toPersianDigits(n.toFixed(1)).replace('.', '٫')

/** Compact form for dense lists: `۴٫۲ میلیون تومان`. */
export function formatTomanCompact(rial: number): string {
  const toman = Math.round(rial / 10)
  if (toman >= 1_000_000_000) return `${decimal(toman / 1_000_000_000)} میلیارد تومان`
  if (toman >= 1_000_000) return `${decimal(toman / 1_000_000)} میلیون تومان`
  if (toman >= 1_000) return `${toPersianDigits((toman / 1_000).toFixed(0))} هزار تومان`
  return `${toPersianDigits(toman)} تومان`
}

/** Normalizes user-typed text: Arabic ی/ک → Persian, Persian digits → Latin, trim. */
export function normalizeFa(input: string): string {
  return toLatinDigits(input)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌+/g, '‌')
    .trim()
}
