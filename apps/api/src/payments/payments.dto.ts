import { z } from 'zod'
import type { OrderStatus, PaymentStatus } from '@prisma/client'

/** Field names mirror what an Iranian gateway appends to the return URL. */
export const verifyPaymentSchema = z.object({
  authority: z.string().min(8),
  /** Accepted for fidelity and logged, but never trusted — see `MockGateway.verify`. */
  status: z.string().optional(),
})
export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>

export interface VerifyPaymentResponse {
  orderId: string
  /** Enough to send the customer back to checkout after a decline — a failure screen with no
   *  route forward just loses the sale. */
  quoteId: string
  quoteOfferId: string
  productTitleFa: string
  amount: number
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  refId: string | null
  policyId: string | null
  messageFa: string
}
