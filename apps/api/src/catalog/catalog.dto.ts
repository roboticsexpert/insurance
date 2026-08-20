import type { Fulfillment, ProductType } from '@prisma/client'

export interface InsurerDto {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  /** سطح توانگری مالی — 1 (strongest) to 5. */
  solvencyLevel: number | null
  claimSatisfaction: number | null
  branchCount: number | null
}

export interface ProductCardDto {
  id: string
  slug: string
  type: ProductType
  titleFa: string
  subtitleFa: string
  iconKey: string
  fulfillment: Fulfillment
  /** Cheapest published premium in Rial, or null while no rates are published. */
  fromAmount: number | null
  /** True while that headline came from placeholder rates — the UI must say «نمونه». */
  fromAmountIsSample: boolean
}

export interface FaqItem {
  q: string
  a: string
}

export interface ProductDetailDto extends ProductCardDto {
  descriptionFa: string
  highlightsFa: string[]
  faq: FaqItem[]
  insurers: InsurerDto[]
}
