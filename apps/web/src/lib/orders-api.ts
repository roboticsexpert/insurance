import { apiFetch } from './api'

export interface InsuredPerson {
  firstName: string
  lastName: string
  nationalCode: string
  /** Gregorian `YYYY-MM-DD`; must match what was quoted, since age sets the price. */
  birthDate: string
  passportNo?: string
}

export interface Order {
  id: string
  status: string
  statusFa: string
  amount: number
  productSlug: string
  productTitleFa: string
  insurer: { id: string; name: string }
  quoteId: string
  quoteOfferId: string
  createdAt: string
  expiresAt: string | null
  isExpired: boolean
  policyId: string | null
}

export const createOrder = (payload: {
  quoteOfferId: string
  insured: InsuredPerson[]
  idempotencyKey: string
}) => apiFetch<Order>('/orders', { method: 'POST', body: payload })

export const payOrder = (orderId: string) =>
  apiFetch<{ redirectUrl: string; authority: string }>(`/orders/${orderId}/pay`, { method: 'POST' })

export const getOrder = (orderId: string) => apiFetch<Order>(`/orders/${orderId}`)

export interface VerifyPaymentResult {
  orderId: string
  quoteId: string
  quoteOfferId: string
  productTitleFa: string
  amount: number
  orderStatus: string
  paymentStatus: 'CREATED' | 'REDIRECTED' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  refId: string | null
  policyId: string | null
  messageFa: string
}

/** Unauthenticated by design — the money moved whether or not the session survived. */
export const verifyPayment = (authority: string, status?: string) =>
  apiFetch<VerifyPaymentResult>('/payments/verify', {
    method: 'POST',
    body: { authority, ...(status ? { status } : {}) },
  })

