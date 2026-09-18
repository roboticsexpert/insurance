import { Injectable, Logger } from '@nestjs/common'
import { OrderStatus, type Prisma, type ProductType } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { toPersianDigits } from '../common/fa'
import { INSURED_RULES } from '../products/insured-rules'
import { ORDER_STATUS_FA } from '../products/labels'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateOrderDto, OrderDto } from './orders.dto'
import { ORDER_TTL_MINUTES } from './orders.constants'
import { assertTransition } from './order-status'

/** Everything needed to render an order without re-reading the world. */
const ORDER_INCLUDE = {
  quoteOffer: {
    include: {
      insurer: true,
      quote: { include: { product: true } },
    },
  },
  policy: { select: { id: true } },
} as const

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto, now = new Date()): Promise<OrderDto> {
    /*
     * Idempotency first, before any validation. A retried request must return the original
     * order even if the quote has since expired — otherwise a flaky network turns one purchase
     * into an error the customer cannot resolve.
     */
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: ORDER_INCLUDE,
    })
    if (existing) {
      if (existing.userId !== userId) throw new AppException('FORBIDDEN')
      return this.toDto(existing, now)
    }

    const offer = await this.prisma.quoteOffer.findUnique({
      where: { id: dto.quoteOfferId },
      include: { quote: true },
    })
    if (!offer) throw new AppException('NOT_FOUND')

    const { quote } = offer
    if (quote.userId && quote.userId !== userId) throw new AppException('QUOTE_NOT_YOURS')
    if (quote.expiresAt <= now) throw new AppException('QUOTE_EXPIRED')
    if (!offer.isEligible) {
      throw new AppException('NO_ELIGIBLE_OFFERS', {
        messageFa: offer.ineligibleReasonFa ?? 'این گزینه قابل خرید نیست.',
      })
    }

    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: quote.productId },
      select: { type: true },
    })
    this.assertInsuredMatchesProduct(product.type, quote.input, dto.insured)

    const order = await this.prisma.order.create({
      data: {
        userId,
        quoteOfferId: offer.id,
        status: OrderStatus.PENDING_PAYMENT,
        amount: offer.totalAmount,
        // Snapshot: editing a profile later must never change an order that was already placed.
        insuredSnapshot: dto.insured as unknown as Prisma.InputJsonValue,
        idempotencyKey: dto.idempotencyKey,
        expiresAt: new Date(now.getTime() + ORDER_TTL_MINUTES * 60_000),
      },
      include: ORDER_INCLUDE,
    })

    // Claim an anonymous quote for the buyer, so it appears under their account afterwards.
    if (!quote.userId) {
      await this.prisma.quote.update({ where: { id: quote.id }, data: { userId } })
    }

    return this.toDto(order, now)
  }

  async findById(id: string, userId: string, now = new Date()): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE })
    if (!order) throw new AppException('NOT_FOUND')
    if (order.userId !== userId) throw new AppException('FORBIDDEN')
    return this.toDto(order, now)
  }

  /**
   * Moves an order, refusing any transition the state machine does not allow.
   *
   * The update is guarded on the current status, so two concurrent callers cannot both move the
   * same order — the loser updates zero rows and is told the transition is invalid. Payment
   * callbacks arrive twice more often than anyone expects.
   */
  async transition(orderId: string, to: OrderStatus, from: OrderStatus): Promise<void> {
    assertTransition(from, to)

    const result = await this.prisma.order.updateMany({
      where: { id: orderId, status: from },
      data: { status: to },
    })

    if (result.count !== 1) {
      this.logger.warn({ orderId, from, to }, 'Order transition lost a race or status moved')
      throw new AppException('ORDER_INVALID_TRANSITION')
    }
  }

  /**
   * The insured must be exactly the people the product names, priced as quoted.
   *
   * Age drives the premium, so quoting a 30-year-old and insuring an 80-year-old would sell
   * cover the insurer never agreed to. The rule is per product (`INSURED_RULES`) rather than
   * inferred from the input's shape: reading `travelers` and returning early when it was absent
   * made this a no-op for motor and home fire, which happily accepted ten insured people —
   * all born in 2050 — on a policy that names one بیمه‌گذار.
   */
  private assertInsuredMatchesProduct(
    productType: ProductType,
    input: Prisma.JsonValue,
    insured: CreateOrderDto['insured'],
  ): void {
    const rule = INSURED_RULES[productType]
    const expected = rule.count(input)

    if (insured.length !== expected) {
      throw new AppException('VALIDATION_FAILED', {
        messageFa: `این بیمه‌نامه برای ${toPersianDigits(expected)} ${rule.subjectFa} صادر می‌شود.`,
      })
    }

    if (rule.requiresPassport) {
      const missing = insured.findIndex((person) => !person.passportNo)
      if (missing !== -1) {
        throw new AppException('VALIDATION_FAILED', {
          fields: { [`insured.${missing}.passportNo`]: 'شماره گذرنامه الزامی است' },
          messageFa: 'شماره گذرنامه همه بیمه‌شدگان الزامی است.',
        })
      }
    }

    const priced = rule.pricedBirthDates(input)
    if (!priced) return

    /*
     * Positional, not sorted. The document pairs person *i* with «حق بیمه — مسافر i», so any
     * reordering between quote and order puts the wrong premium beside the wrong person on the
     * customer's own policy — with a correct total, which is what made it hard to notice.
     */
    const mismatch = priced.findIndex((date, index) => date !== insured[index]?.birthDate)
    if (mismatch !== -1) {
      throw new AppException('VALIDATION_FAILED', {
        fields: { [`insured.${mismatch}.birthDate`]: 'تاریخ تولد با استعلام یکسان نیست' },
        messageFa: 'مشخصات بیمه‌شدگان با استعلام همخوانی ندارد. لطفاً دوباره استعلام بگیرید.',
      })
    }
  }

  private toDto(order: OrderWithRelations, now: Date): OrderDto {
    const { quoteOffer } = order
    const { quote, insurer } = quoteOffer

    return {
      id: order.id,
      status: order.status,
      statusFa: ORDER_STATUS_FA[order.status],
      amount: order.amount,
      productSlug: quote.product.slug,
      productTitleFa: quote.product.titleFa,
      productType: quote.product.type,
      insurer: {
        id: insurer.id,
        slug: insurer.slug,
        name: insurer.name,
        logoUrl: insurer.logoUrl,
        solvencyLevel: insurer.solvencyLevel,
        claimSatisfaction: insurer.claimSatisfaction,
        branchCount: insurer.branchCount,
      },
      quoteId: quote.id,
      quoteOfferId: quoteOffer.id,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt?.toISOString() ?? null,
      // Only a still-payable order can expire; once paid the clock is irrelevant.
      isExpired:
        order.status === OrderStatus.PENDING_PAYMENT &&
        order.expiresAt !== null &&
        order.expiresAt <= now,
      policyId: order.policy?.id ?? null,
    }
  }
}
