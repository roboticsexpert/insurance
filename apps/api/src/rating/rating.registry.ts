import { Inject, Injectable, Optional } from '@nestjs/common'
import type { ProductType } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { RATING_STRATEGIES, type RatingStrategy } from './rating-strategy'

@Injectable()
export class RatingRegistry {
  private readonly byType = new Map<ProductType, RatingStrategy>()

  constructor(@Optional() @Inject(RATING_STRATEGIES) strategies: RatingStrategy[] = []) {
    for (const strategy of strategies) {
      if (this.byType.has(strategy.productType)) {
        // Two strategies for one product would make pricing depend on provider order.
        throw new Error(`Duplicate rating strategy for ${strategy.productType}`)
      }
      this.byType.set(strategy.productType, strategy)
    }
  }

  /**
   * A product with no strategy cannot be priced. That is a configuration problem, so it
   * surfaces as "this product is not currently available" rather than a 500.
   */
  get(productType: ProductType): RatingStrategy {
    const strategy = this.byType.get(productType)
    if (!strategy) throw new AppException('PRODUCT_UNAVAILABLE')
    return strategy
  }

  has(productType: ProductType): boolean {
    return this.byType.has(productType)
  }

  get supportedTypes(): ProductType[] {
    return [...this.byType.keys()]
  }
}
