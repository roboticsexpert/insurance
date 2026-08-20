import { Injectable, Logger } from '@nestjs/common'
import type { Insurer, Offering, Product } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { RatingRegistry } from './rating.registry'
import type { RatingLookups } from './rating-strategy'
import type { RatingResult } from './rating.types'

export interface RatedOffer {
  offering: Offering & { insurer: Insurer }
  rateTableVersion: number
  result: RatingResult
  /** True while this insurer's table is still placeholder data. */
  isSampleRates: boolean
}

export interface RatedProduct {
  product: Product
  offers: RatedOffer[]
  /** True if *any* offer priced from a placeholder table — drives the «نمونه» badge. */
  isSampleRates: boolean
}

interface RateTableMeta {
  source?: string
}

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: RatingRegistry,
  ) {}

  /**
   * Prices one product against every insurer selling it.
   *
   * The input is parsed once and reused, so a validation error is reported before any insurer
   * is rated — the user should not see "three insurers refused you" when the real problem is a
   * malformed date.
   */
  async rateProduct(productSlug: string, rawInput: unknown, now = new Date()): Promise<RatedProduct> {
    const product = await this.prisma.product.findFirst({
      where: { slug: productSlug, isActive: true },
    })
    if (!product) throw new AppException('NOT_FOUND')

    const strategy = this.registry.get(product.type)
    const parsed = strategy.parse(rawInput, { now })
    // Resolved once, not once per insurer: five insurers must not mean five identical lookups.
    const input = strategy.prepare ? await strategy.prepare(parsed, this.lookups) : parsed

    const offerings = await this.prisma.offering.findMany({
      where: { productId: product.id, isActive: true, insurer: { isActive: true } },
      include: { insurer: true },
      orderBy: { sortWeight: 'asc' },
    })

    const tables = await this.effectiveRateTables(
      offerings.map((o) => o.id),
      now,
    )

    const offers: RatedOffer[] = []

    for (const offering of offerings) {
      const table = tables.get(offering.id)
      if (!table) {
        // An insurer with no published rates is silently absent, not an error: the others can
        // still be quoted, and a half-configured insurer must not break the whole comparison.
        this.logger.warn(
          { offeringId: offering.id, insurer: offering.insurer.slug, productSlug },
          'No effective rate table; skipping insurer',
        )
        continue
      }

      const meta = (table.data as { meta?: RateTableMeta } | null)?.meta
      offers.push({
        offering,
        rateTableVersion: table.version,
        result: strategy.rate(input, table.data, { now }),
        isSampleRates: meta?.source === 'PLACEHOLDER',
      })
    }

    if (offers.length === 0) throw new AppException('NO_ELIGIBLE_OFFERS')

    return {
      product,
      offers,
      isSampleRates: offers.some((offer) => offer.isSampleRates),
    }
  }

  /**
   * The highest-version table in force for each offering at `now`.
   *
   * Versions are per offering, so this cannot be a single `ORDER BY … LIMIT 1`; the rows are
   * fetched and reduced in code. The set is small — one row per insurer per product.
   */
  private async effectiveRateTables(
    offeringIds: string[],
    now: Date,
  ): Promise<Map<string, { version: number; data: unknown }>> {
    if (offeringIds.length === 0) return new Map()

    const rows = await this.prisma.rateTable.findMany({
      where: {
        offeringId: { in: offeringIds },
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      orderBy: { version: 'asc' },
      select: { offeringId: true, version: true, data: true },
    })

    // Ascending order means a later row always supersedes an earlier one.
    const latest = new Map<string, { version: number; data: unknown }>()
    for (const row of rows) {
      latest.set(row.offeringId, { version: row.version, data: row.data })
    }
    return latest
  }

  /**
   * Recomputes the «از … تومان» teaser on every product from the live rate tables.
   *
   * Run this after seeding or whenever rate tables change — a headline price is the one number
   * a customer sees before committing any effort, so it must be derived, never authored.
   *
   * Products the engine cannot price, or that no insurer will quote, get `null` rather than a
   * stale or invented figure: showing no price is honest, showing a wrong one is not.
   */
  async refreshTeaserPrices(
    now = new Date(),
  ): Promise<{ slug: string; fromAmount: number | null; isSample: boolean }[]> {
    const products = await this.prisma.product.findMany({ where: { isActive: true } })
    const summary: { slug: string; fromAmount: number | null; isSample: boolean }[] = []

    for (const product of products) {
      const { amount, isSample } = await this.cheapestTeaser(product.slug, product.type, now)

      await this.prisma.product.update({
        where: { id: product.id },
        data: { fromAmount: amount, fromAmountIsSample: isSample },
      })
      summary.push({ slug: product.slug, fromAmount: amount, isSample })
    }

    return summary
  }

  private async cheapestTeaser(
    slug: string,
    productType: Product['type'],
    now: Date,
  ): Promise<{ amount: number | null; isSample: boolean }> {
    const none = { amount: null, isSample: false }
    if (!this.registry.has(productType)) return none

    const baskets = (await this.registry.get(productType).teaserInputs?.({ now }, this.lookups)) ?? []
    if (baskets.length === 0) return none

    let cheapest: number | null = null
    let isSample = false

    for (const basket of baskets) {
      let rated: RatedProduct
      try {
        rated = await this.rateProduct(slug, basket, now)
      } catch {
        // A basket no insurer will quote just does not contribute a candidate price.
        continue
      }

      for (const offer of rated.offers) {
        if (!offer.result.eligible) continue
        if (cheapest === null || offer.result.totalAmount < cheapest) {
          cheapest = offer.result.totalAmount
          // Whether the headline is a sample follows the offer that actually set it.
          isSample = offer.isSampleRates
        }
      }
    }

    return { amount: cheapest, isSample }
  }

  /**
   * The database side of `RatingLookups`. Kept here rather than injected into each strategy so
   * a strategy never imports Prisma — the port is the whole of its access to stored data.
   */
  private readonly lookups: RatingLookups = {
    cityQuakeZone: async (cityId) => {
      const city = await this.prisma.city.findUnique({
        where: { id: cityId },
        select: { quakeZone: true },
      })
      return city?.quakeZone ?? null
    },
    cityQuakeZones: () =>
      this.prisma.city.findMany({ select: { id: true, quakeZone: true } }),
    vehicleModelGroup: async (vehicleModelId) => {
      const model = await this.prisma.vehicleModel.findFirst({
        where: { id: vehicleModelId, isActive: true },
        select: { group: true },
      })
      return model?.group ?? null
    },
    vehicleModelGroups: () =>
      this.prisma.vehicleModel.findMany({
        where: { isActive: true },
        select: { id: true, group: true },
      }),
  }
}
