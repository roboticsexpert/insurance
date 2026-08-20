import { roundPremium, type Rial } from '../common/money'
import { formatToman, toPersianDigits } from '../common/fa'
import { LineItemKind } from '../products/labels'
import type { CoverageItem, PremiumLineItem, RatingResult } from './rating.types'

export interface Band {
  /** Inclusive upper bound. The first band whose bound is not exceeded wins. */
  max: number
  factor: number
}

/**
 * Picks the band a value falls into. Bands are assumed sorted ascending; the last one is used
 * for anything above the final bound, so a table can never fail to price a value it should
 * have covered.
 */
export function pickBand(bands: readonly Band[], value: number): Band {
  for (const band of bands) {
    if (value <= band.max) return band
  }
  const last = bands[bands.length - 1]
  if (!last) throw new Error('pickBand called with an empty band list')
  return last
}

/**
 * Assembles a premium into the line items a real invoice shows.
 *
 * Tax is computed at `build()` time rather than when it is declared, so it is impossible to
 * add a premium line after the tax and silently under-charge — an ordering bug this design
 * removes rather than documents.
 *
 * Premium and discount lines are rounded to the nearest 1,000 Rial **as they are added**, not
 * at the end. Rounding only the sum would leave the displayed lines adding up to something
 * other than the amount charged — a few hundred Rial that nobody can reconcile later.
 *
 * Invariants, both asserted in the tests:
 *   netPremium  = Σ PREMIUM + Σ DISCOUNT   (discounts are stored negative)
 *   totalAmount = Σ every line item        (levies never fold into the premium)
 */
export class PremiumBuilder {
  private readonly items: PremiumLineItem[] = []
  private taxRate = 0
  private taxLabel = 'مالیات بر ارزش افزوده'
  readonly explain: string[] = []

  premium(key: string, labelFa: string, amount: Rial, explanation?: string): this {
    this.items.push({ key, labelFa, amount: roundPremium(amount), kind: LineItemKind.PREMIUM })
    if (explanation) this.note(explanation)
    return this
  }

  /** `amount` is the positive size of the discount; it is recorded as a negative line. */
  discount(key: string, labelFa: string, amount: Rial, explanation?: string): this {
    this.items.push({
      key,
      labelFa,
      amount: -roundPremium(Math.abs(amount)),
      kind: LineItemKind.DISCOUNT,
    })
    if (explanation) this.note(explanation)
    return this
  }

  fee(key: string, labelFa: string, amount: Rial, explanation?: string): this {
    this.items.push({ key, labelFa, amount: Math.round(amount), kind: LineItemKind.FEE })
    if (explanation) this.note(explanation)
    return this
  }

  withTax(rate: number, labelFa?: string): this {
    this.taxRate = rate
    if (labelFa) this.taxLabel = labelFa
    return this
  }

  /** Adds a line to the human-readable trace without affecting the price. */
  note(line: string): this {
    this.explain.push(line)
    return this
  }

  build(): { netPremium: Rial; lineItems: PremiumLineItem[]; totalAmount: Rial } {
    // Lines are already rounded, so this sum is exact — no second rounding to drift against.
    const net = this.items
      .filter((i) => i.kind === LineItemKind.PREMIUM || i.kind === LineItemKind.DISCOUNT)
      .reduce((sum, i) => sum + i.amount, 0)

    const lineItems = [...this.items]

    if (this.taxRate > 0) {
      const tax = Math.round(net * this.taxRate)
      lineItems.push({ key: 'tax', labelFa: this.taxLabel, amount: tax, kind: LineItemKind.TAX })
      this.note(
        `${this.taxLabel}: ${toPersianDigits((this.taxRate * 100).toFixed(0))}٪ از ${formatToman(net)}`,
      )
    }

    const totalAmount = lineItems.reduce((sum, i) => sum + i.amount, 0)
    return { netPremium: net, lineItems, totalAmount }
  }

  /** Convenience for the common case: an eligible result with the given coverages. */
  toResult(coverages: CoverageItem[]): RatingResult {
    const { netPremium, lineItems, totalAmount } = this.build()
    return {
      eligible: true,
      netPremium,
      lineItems,
      totalAmount,
      coverages,
      explain: [...this.explain],
    }
  }
}

/** A refusal is a first-class outcome, not an exception — the UI shows the reason. */
export function ineligible(reasonFa: string, explain: string[] = []): RatingResult {
  return {
    eligible: false,
    ineligibleReasonFa: reasonFa,
    netPremium: 0,
    lineItems: [],
    totalAmount: 0,
    coverages: [],
    explain: [...explain, `رد شد: ${reasonFa}`],
  }
}
