import type { ProductType } from '@prisma/client'
import type { InsurerDto } from '../catalog/catalog.dto'
import type { CoverageItem, PremiumLineItem } from '../rating/rating.types'

/**
 * Three states, not two.
 *
 * A travel policy bought for next month has not started yet — calling it "expired" is wrong and
 * calling it "active" is a lie the customer would notice at the airport.
 */
export type PolicyStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRED'

export const POLICY_STATUS_FA: Record<PolicyStatus, string> = {
  UPCOMING: 'شروع نشده',
  ACTIVE: 'معتبر',
  EXPIRED: 'منقضی',
}

export interface PolicyListItemDto {
  id: string
  policyNumber: string
  productType: ProductType
  productTitleFa: string
  insurerName: string
  startsAt: string
  endsAt: string
  issuedAt: string
  amount: number
  status: PolicyStatus
  statusFa: string
}

export interface PolicyDetailDto extends PolicyListItemDto {
  insurer: InsurerDto | null
  insured: {
    firstName?: string
    lastName?: string
    nationalCode?: string
    birthDate?: string
    passportNo?: string
  }[]
  coverages: CoverageItem[]
  lineItems: PremiumLineItem[]
  /** Relative; the client resolves it against the API base. */
  documentUrl: string
}
