import { Injectable, Logger } from '@nestjs/common'
import { OrderStatus, type Prisma } from '@prisma/client'
import { AppException } from '../common/app.exception'
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

interface QuotedTraveler {
  birthDate: string
}

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

    this.assertInsuredMatchesQuote(quote.input, dto.insured)

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
   * The insured must be exactly the people who were priced.
   *
   * Age drives the premium, so quoting a 30-year-old and insuring an 80-year-old would sell
   * cover the insurer never agreed to. Count and dates of birth both have to match.
   */
  private assertInsuredMatchesQuote(input: Prisma.JsonValue, insured: CreateOrderDto['insured']): void {
    const travelers = (input as { travelers?: QuotedTraveler[] } | null)?.travelers
    if (!Array.isArray(travelers)) return

    if (travelers.length !== insured.length) {
      throw new AppException('VALIDATION_FAILED', {
        messageFa: 'تعداد بیمه‌شدگان با استعلام یکسان نیست. لطفاً دوباره استعلام بگیرید.',
      })
    }

    const quoted = [...travelers.map((t) => t.birthDate)].sort()
    const given = [...insured.map((p) => p.birthDate)].sort()

    if (quoted.some((date, index) => date !== given[index])) {
      throw new AppException('VALIDATION_FAILED', {
        fields: { insured: 'تاریخ تولد بیمه‌شدگان با استعلام یکسان نیست' },
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
