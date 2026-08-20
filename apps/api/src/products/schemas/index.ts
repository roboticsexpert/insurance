import type { ZodTypeAny } from 'zod'
import { ProductType } from '@prisma/client'
import { travelInputSchema } from './travel'
import { motorTplInputSchema } from './motor-tpl'
import { homeFireInputSchema } from './home-fire'

export * from './common'
export * from './travel'
export * from './motor-tpl'
export * from './home-fire'

/**
 * The one registry. The API validates every quote request against it.
 * A product without an entry here cannot be quoted.
 */
export const productInputSchemas: Record<ProductType, ZodTypeAny> = {
  [ProductType.TRAVEL]: travelInputSchema,
  [ProductType.MOTOR_TPL]: motorTplInputSchema,
  [ProductType.HOME_FIRE]: homeFireInputSchema,
}

export const getProductInputSchema = (type: ProductType): ZodTypeAny => {
  const schema = productInputSchemas[type]
  if (!schema) throw new Error(`No input schema registered for product type ${type}`)
  return schema
}
