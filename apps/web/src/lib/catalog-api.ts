import { apiFetch } from './api'

export type ProductType = 'TRAVEL' | 'MOTOR_TPL' | 'HOME_FIRE'

export interface ProductCard {
  id: string
  slug: string
  type: ProductType
  titleFa: string
  subtitleFa: string
  iconKey: string
  fulfillment: 'INSTANT' | 'MANUAL_QUOTE'
  /** Rial. Null when nothing can be priced yet — the card then says «به‌زودی». */
  fromAmount: number | null
  fromAmountIsSample: boolean
}

export const getProducts = () => apiFetch<ProductCard[]>('/catalog/products')
