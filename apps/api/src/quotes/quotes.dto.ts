import { z } from 'zod'
import type { ProductType } from '@prisma/client'
import type { InsurerDto } from '../catalog/catalog.dto'
import type { CoverageItem, PremiumLineItem } from '../rating/rating.types'

export const createQuoteSchema = z.object({
  productSlug: z.string().min(1),
  /** Product-specific; the rating strategy owns its validation. */
  input: z.unknown(),
})
export type CreateQuoteDto = z.infer<typeof createQuoteSchema>

/**
 * `CHEAPEST` and `RECOMMENDED` are computed from transparent rules — never sold. There is
 * deliberately no `BEST_COVERAGE` badge yet: every travel insurer grants the same coverage
 * keys, so it would be a badge with nothing behind it.
 */
export type OfferBadge = 'CHEAPEST' | 'RECOMMENDED'

export interface QuoteOfferDto {
  id: string
  insurer: InsurerDto
  featuresFa: string[]
  netPremium: number
  totalAmount: number
  lineItems: PremiumLineItem[]
  coverages: CoverageItem[]
  isEligible: boolean
  ineligibleReasonFa: string | null
  badges: OfferBadge[]
}

export interface QuoteDto {
  id: string
  productSlug: string
  productTitleFa: string
  productType: ProductType
  input: unknown
  createdAt: string
  expiresAt: string
  isExpired: boolean
  /** True while any offer was priced from a placeholder table — drives the «نمونه» badge. */
  isSampleRates: boolean
  offers: QuoteOfferDto[]
}
