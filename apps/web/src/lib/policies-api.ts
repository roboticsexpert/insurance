import { apiFetch, apiFetchText } from './api'
import type { ProductType } from './catalog-api'
import type { CoverageItem, PremiumLineItem } from './quotes-api'

export type PolicyStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRED'

export interface PolicyListItem {
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

export interface PolicyDetail extends PolicyListItem {
  insurer: {
    id: string
    name: string
    solvencyLevel: number | null
    claimSatisfaction: number | null
    branchCount: number | null
  } | null
  insured: {
    firstName?: string
    lastName?: string
    nationalCode?: string
    birthDate?: string
    passportNo?: string
  }[]
  coverages: CoverageItem[]
  lineItems: PremiumLineItem[]
  documentUrl: string
}

export const getPolicies = () => apiFetch<PolicyListItem[]>('/policies')
export const getPolicy = (id: string) => apiFetch<PolicyDetail>(`/policies/${id}`)
export const getPolicyDocument = (id: string) => apiFetchText(`/policies/${id}/document`)
