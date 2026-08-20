import { z } from 'zod'
import type { LineItemKind } from '../products/labels'
import type { Rial } from '../common/money'

/** One row on the premium invoice. Levies and tax are never folded into the premium. */
export interface PremiumLineItem {
  key: string
  labelFa: string
  amount: Rial
  kind: LineItemKind
}

/** A coverage the policy grants, rendered as a label/value pair in the UI. */
export interface CoverageItem {
  key: string
  labelFa: string
  valueFa: string
  /** Shown with more emphasis in the comparison card. */
  highlight?: boolean
}

export interface RatingResult {
  eligible: boolean
  ineligibleReasonFa?: string
  netPremium: Rial
  lineItems: PremiumLineItem[]
  totalAmount: Rial
  coverages: CoverageItem[]
  /** Human-readable trace of every factor applied. Stored, so a price is explainable later. */
  explain: string[]
}

export const quoteRequestSchema = z.object({
  productSlug: z.string().min(1),
  input: z.unknown(),
})
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
