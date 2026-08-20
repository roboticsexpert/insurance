import { z } from 'zod'
import type { OrderStatus, ProductType } from '@prisma/client'
import type { InsurerDto } from '../catalog/catalog.dto'
import { insuredPersonSchema } from '../products/schemas/common'

export const createOrderSchema = z.object({
  quoteOfferId: z.string().min(1),
  /** One per person quoted — identity is collected here, not at quote time. */
  insured: z.array(insuredPersonSchema).min(1).max(10),
  /** Client-generated, so a double-tapped buy button cannot create two orders. */
  idempotencyKey: z.string().uuid({ message: 'کلید یکتا معتبر نیست' }),
})
export type CreateOrderDto = z.infer<typeof createOrderSchema>

export interface OrderDto {
  id: string
  status: OrderStatus
  statusFa: string
  amount: number
  productSlug: string
  productTitleFa: string
  productType: ProductType
  insurer: InsurerDto
  quoteId: string
  quoteOfferId: string
  createdAt: string
  expiresAt: string | null
  isExpired: boolean
  policyId: string | null
}
