/**
 * کمک‌کننده‌های نمایش فارسی.
 *
 * زیرمجموعه‌ای از `apps/web/src/lib/fa.ts` است و عمداً کپی شده نه از یک پکیج مشترک —
 * به همان دلیلی که آنجا نوشته شده: چند خط ثابت از یک مرحله بیلد بین‌پکیجی ارزان‌تر است.
 * اگر آنجا عوض شد، اینجا هم عوضش کنید.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const

export const toPersianDigits = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] as string)

/** ارقام فارسی و عربی را به لاتین برمی‌گرداند — برای خواندن چیزی که کاربر تایپ کرده. */
export const toLatinDigits = (input: string): string =>
  input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

const groupDigits = (n: number): string =>
  Math.trunc(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '٬')

/** مبلغ‌ها به ریال می‌رسند و همیشه به تومان نشان داده می‌شوند، هرگز به‌صورت عدد خام. */
export const formatToman = (rial: number, opts: { withUnit?: boolean } = {}): string => {
  const body = toPersianDigits(groupDigits(Math.round(rial / 10)))
  return opts.withUnit === false ? body : `${body} تومان`
}

const decimal = (n: number): string =>
  toPersianDigits(n.toFixed(1).replace(/\.0$/, '')).replace('.', '٫')

export const formatTomanCompact = (rial: number): string => {
  const toman = Math.round(rial / 10)
  if (toman >= 1_000_000_000) return `${decimal(toman / 1e9)} میلیارد تومان`
  if (toman >= 1_000_000) return `${decimal(toman / 1e6)} میلیون تومان`
  if (toman >= 1_000) return `${toPersianDigits(Math.round(toman / 1e3))} هزار تومان`
  return `${toPersianDigits(toman)} تومان`
}

const jalaliLong = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Tehran',
})

/** `۲۹ مرداد ۱۴۰۵` */
export const formatJalali = (value: Date | string): string =>
  jalaliLong.format(value instanceof Date ? value : new Date(value))
