/** Jalali `yymm`, e.g. `0505` for Mordad 1405 — the period a policy number is scoped to. */
const jalaliParts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  timeZone: 'UTC',
})

export function jalaliPeriod(date: Date): string {
  const parts = jalaliParts.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year').slice(-2)}${get('month').padStart(2, '0')}`
}

/** Three-letter codes so a policy number is readable at a glance. */
const PRODUCT_CODES: Record<string, string> = {
  TRAVEL: 'TRV',
  MOTOR_TPL: 'TPL',
  HOME_FIRE: 'FIR',
}

export const productCode = (productType: string): string => PRODUCT_CODES[productType] ?? 'GEN'

export const insurerCode = (slug: string): string =>
  slug.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase().padEnd(3, 'X')

/** `DEY-TRV-0505-000123` */
export function formatPolicyNumber(params: {
  insurerSlug: string
  productType: string
  period: string
  sequence: number
}): string {
  return [
    insurerCode(params.insurerSlug),
    productCode(params.productType),
    params.period,
    String(params.sequence).padStart(6, '0'),
  ].join('-')
}
