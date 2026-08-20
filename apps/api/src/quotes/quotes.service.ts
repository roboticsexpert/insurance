import { Injectable } from '@nestjs/common'
import { QuoteStatus, type Insurer, type Prisma } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { RatingService } from '../rating/rating.service'
import type { CoverageItem, PremiumLineItem } from '../rating/rating.types'
import { QUOTE_TTL_MINUTES, RECOMMENDED_PRICE_TOLERANCE } from './quotes.constants'
import type { OfferBadge, QuoteDto, QuoteOfferDto } from './quotes.dto'

type StoredOffer = {
  id: string
  insurer: Insurer
  offering: { featuresFa: string[] }
  netPremium: number
  totalAmount: number
  lineItems: Prisma.JsonValue
  coverages: Prisma.JsonValue
  isEligible: boolean
  ineligibleReasonFa: string | null
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rating: RatingService,
  ) {}

  /**
   * Prices a product and **stores the result**.
   *
   * Everything the customer was shown is frozen here — premium, line items, coverages and the
   * engine's explain trace. An order later references this row rather than re-rating, so a
   * rate table changing mid-checkout can never quietly change the price someone agreed to.
   */
  async create(
    productSlug: string,
    input: unknown,
    userId: string | null,
    now = new Date(),
  ): Promise<QuoteDto> {
    const rated = await this.rating.rateProduct(productSlug, input, now)

    const quote = await this.prisma.quote.create({
      data: {
        userId,
        productId: rated.product.id,
        input: input as Prisma.InputJsonValue,
        expiresAt: new Date(now.getTime() + QUOTE_TTL_MINUTES * 60_000),
        isSampleRates: rated.isSampleRates,
        offers: {
          create: rated.offers.map((offer) => ({
            offeringId: offer.offering.id,
            insurerId: offer.offering.insurerId,
            netPremium: offer.result.netPremium,
            totalAmount: offer.result.totalAmount,
            lineItems: offer.result.lineItems as unknown as Prisma.InputJsonValue,
            coverages: offer.result.coverages as unknown as Prisma.InputJsonValue,
            breakdown: offer.result.explain as unknown as Prisma.InputJsonValue,
            isEligible: offer.result.eligible,
            ineligibleReasonFa: offer.result.ineligibleReasonFa ?? null,
            rateTableVersion: offer.rateTableVersion,
          })),
        },
      },
      include: {
        product: true,
        offers: { include: { insurer: true, offering: { select: { featuresFa: true } } } },
      },
    })

    return this.toDto(quote, quote.isSampleRates, now)
  }

  /**
   * Reads a stored quote. Never re-rates — the whole point is that the price does not move.
   *
   * A quote created anonymously is claimed by the first authenticated caller that presents its
   * id, which is how "quote before login" survives the login that happens at checkout.
   */
  async findById(id: string, userId: string | null, now = new Date()): Promise<QuoteDto> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        product: true,
        offers: { include: { insurer: true, offering: { select: { featuresFa: true } } } },
      },
    })

    if (!quote) throw new AppException('NOT_FOUND')
    if (quote.userId && quote.userId !== userId) throw new AppException('QUOTE_NOT_YOURS')

    if (!quote.userId && userId) {
      await this.prisma.quote.update({ where: { id }, data: { userId } })
    }

    return this.toDto(quote, quote.isSampleRates, now)
  }

  private toDto(
    quote: {
      id: string
      input: Prisma.JsonValue
      createdAt: Date
      expiresAt: Date
      status: QuoteStatus
      product: { slug: string; titleFa: string; type: QuoteDto['productType'] }
      offers: StoredOffer[]
    },
    isSampleRates: boolean,
    now: Date,
  ): QuoteDto {
    const offers = this.sortAndBadge(quote.offers)

    return {
      id: quote.id,
      productSlug: quote.product.slug,
      productTitleFa: quote.product.titleFa,
      productType: quote.product.type,
      input: quote.input,
      createdAt: quote.createdAt.toISOString(),
      expiresAt: quote.expiresAt.toISOString(),
      isExpired: quote.expiresAt <= now || quote.status === QuoteStatus.EXPIRED,
      isSampleRates,
      offers,
    }
  }

  /**
   * Cheapest first, refusals last.
   *
   * A refused insurer stays in the list rather than being hidden: "this company will not cover
   * an 82-year-old" is information the customer wants, and silently dropping it looks like the
   * comparison is incomplete.
   */
  private sortAndBadge(stored: StoredOffer[]): QuoteOfferDto[] {
    const offers = stored.map((offer) => ({
      id: offer.id,
      insurer: {
        id: offer.insurer.id,
        slug: offer.insurer.slug,
        name: offer.insurer.name,
        logoUrl: offer.insurer.logoUrl,
        solvencyLevel: offer.insurer.solvencyLevel,
        claimSatisfaction: offer.insurer.claimSatisfaction,
        branchCount: offer.insurer.branchCount,
      },
      featuresFa: offer.offering.featuresFa,
      netPremium: offer.netPremium,
      totalAmount: offer.totalAmount,
      lineItems: offer.lineItems as unknown as PremiumLineItem[],
      coverages: offer.coverages as unknown as CoverageItem[],
      isEligible: offer.isEligible,
      ineligibleReasonFa: offer.ineligibleReasonFa,
      badges: [] as OfferBadge[],
    }))

    offers.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1
      return a.totalAmount - b.totalAmount
    })

    const eligible = offers.filter((offer) => offer.isEligible)
    if (eligible.length === 0) return offers

    const cheapest = eligible[0]
    if (cheapest) cheapest.badges.push('CHEAPEST')

    // Best claims record among options that are not meaningfully more expensive. A transparent
    // rule, not a paid placement — if anything here ever becomes commercial, say so in the UI.
    const ceiling = (cheapest?.totalAmount ?? 0) * (1 + RECOMMENDED_PRICE_TOLERANCE)
    const contenders = eligible.filter((offer) => offer.totalAmount <= ceiling)
    const recommended = contenders.reduce<(typeof contenders)[number] | null>(
      (best, offer) =>
        best === null || (offer.insurer.claimSatisfaction ?? 0) > (best.insurer.claimSatisfaction ?? 0)
          ? offer
          : best,
      null,
    )
    if (recommended) recommended.badges.push('RECOMMENDED')

    return offers
  }
}
