import { apiFetch } from './api'
import type { ProductType } from './catalog-api'

export interface PremiumLineItem {
  key: string
  labelFa: string
  amount: number
  kind: 'PREMIUM' | 'DISCOUNT' | 'TAX' | 'FEE'
}

export interface CoverageItem {
  key: string
  labelFa: string
  valueFa: string
  highlight?: boolean
}

export interface QuoteOffer {
  id: string
  insurer: {
    id: string
    slug: string
    name: string
    logoUrl: string | null
    solvencyLevel: number | null
    claimSatisfaction: number | null
    branchCount: number | null
  }
  featuresFa: string[]
  netPremium: number
  totalAmount: number
  lineItems: PremiumLineItem[]
  coverages: CoverageItem[]
  isEligible: boolean
  ineligibleReasonFa: string | null
  badges: ('CHEAPEST' | 'RECOMMENDED')[]
}

export interface Quote {
  id: string
  productSlug: string
  productTitleFa: string
  productType: ProductType
  input: unknown
  createdAt: string
  expiresAt: string
  isExpired: boolean
  isSampleRates: boolean
  offers: QuoteOffer[]
}

export const createQuote = (productSlug: string, input: unknown) =>
  apiFetch<Quote>('/quotes', { method: 'POST', body: { productSlug, input } })

export const getQuote = (id: string) => apiFetch<Quote>(`/quotes/${id}`)

export interface ReferenceItem {
  value: string
  labelFa: string
  groupFa?: string
  meta?: Record<string, string | number>
}

export const getReference = (key: string) =>
  apiFetch<ReferenceItem[]>(`/catalog/reference/${key}`)
