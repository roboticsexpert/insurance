import { Injectable, Logger } from '@nestjs/common'
import { OrderStatus, type Prisma } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { NotificationsService } from '../notifications/notifications.service'
import { OrdersService } from '../orders/orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { RatingRegistry } from '../rating/rating.registry'
import { ENV } from '../config/config.module'
import type { Env } from '../config/env'
import { Inject } from '@nestjs/common'
import {
  POLICY_STATUS_FA,
  type PolicyDetailDto,
  type PolicyListItemDto,
  type PolicyStatus,
} from './policies.dto'
import { renderPolicyDocument } from './policy-document'
import { formatPolicyNumber, jalaliPeriod } from './policy-number'

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly registry: RatingRegistry,
    private readonly notifications: NotificationsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** The customer's policies, newest first. */
  async listForUser(userId: string, now = new Date()): Promise<PolicyListItemDto[]> {
    const policies = await this.prisma.policy.findMany({
      where: { order: { userId } },
      orderBy: { issuedAt: 'desc' },
      include: { insurer: true, order: { select: { amount: true } } },
    })

    return policies.map((policy) => this.toListItem(policy, now))
  }

  async findForUser(policyId: string, userId: string, now = new Date()): Promise<PolicyDetailDto> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { insurer: true, order: { select: { amount: true, userId: true } } },
    })

    if (!policy) throw new AppException('NOT_FOUND')
    if (policy.order.userId !== userId) throw new AppException('FORBIDDEN')

    const snapshot = policy.dataSnapshot as Record<string, unknown> | null

    return {
      ...this.toListItem(policy, now),
      insurer: {
        id: policy.insurer.id,
        slug: policy.insurer.slug,
        name: policy.insurer.name,
        logoUrl: policy.insurer.logoUrl,
        solvencyLevel: policy.insurer.solvencyLevel,
        claimSatisfaction: policy.insurer.claimSatisfaction,
        branchCount: policy.insurer.branchCount,
      },
      insured: (snapshot?.insured as PolicyDetailDto['insured']) ?? [],
      coverages: (snapshot?.coverages as PolicyDetailDto['coverages']) ?? [],
      lineItems: (snapshot?.lineItems as PolicyDetailDto['lineItems']) ?? [],
      documentUrl: `/policies/${policy.id}/document`,
    }
  }

  /**
   * Everything the list needs comes from the snapshot, so a policy still renders correctly
   * after its product was renamed or withdrawn from sale.
   */
  private toListItem(
    policy: {
      id: string
      policyNumber: string
      startsAt: Date
      endsAt: Date
      issuedAt: Date
      dataSnapshot: unknown
      insurer: { name: string }
      order: { amount: number }
    },
    now: Date,
  ): PolicyListItemDto {
    const snapshot = policy.dataSnapshot as Record<string, unknown> | null
    const status = policyStatus(policy.startsAt, policy.endsAt, now)

    return {
      id: policy.id,
      policyNumber: policy.policyNumber,
      productType: (snapshot?.productType as PolicyListItemDto['productType']) ?? 'TRAVEL',
      productTitleFa: (snapshot?.productTitleFa as string) ?? 'بیمه‌نامه',
      insurerName: (snapshot?.insurerName as string) ?? policy.insurer.name,
      startsAt: policy.startsAt.toISOString(),
      endsAt: policy.endsAt.toISOString(),
      issuedAt: policy.issuedAt.toISOString(),
      amount: policy.order.amount,
      status,
      statusFa: POLICY_STATUS_FA[status],
    }
  }

  /**
   * The customer's copy of their policy.
   *
   * Returns HTML today. The seam is the return type: when PDF matters, this becomes a Buffer
   * and callers do not change. PDF is deferred because Persian RTL needs headless Chromium,
   * which would roughly triple the deployment image for something a print dialog already does.
   */
  async renderDocument(policyId: string, userId: string): Promise<string> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { order: { select: { userId: true } } },
    })

    if (!policy) throw new AppException('NOT_FOUND')
    if (policy.order.userId !== userId) throw new AppException('FORBIDDEN')

    return renderPolicyDocument({
      policyNumber: policy.policyNumber,
      startsAt: policy.startsAt,
      endsAt: policy.endsAt,
      issuedAt: policy.issuedAt,
      snapshot: policy.dataSnapshot as never,
      verifyUrl: `${this.env.WEB_URL}/policies/${policy.id}`,
    })
  }

  /**
   * Issues the policy for a paid order.
   *
   * Written as if the insurer were remote — because it will be. Today `issueWithInsurer` returns
   * immediately, but it is a promise with a failure path, and a failure lands the order in
   * `ISSUE_FAILED` rather than throwing away a payment that already succeeded.
   *
   * Idempotent: an order that already has a policy returns it untouched.
   */
  async issueForOrder(orderId: string, now = new Date()): Promise<{ policyId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        policy: { select: { id: true } },
        user: true,
        quoteOffer: { include: { insurer: true, quote: { include: { product: true } } } },
      },
    })

    if (!order) throw new AppException('NOT_FOUND')
    if (order.policy) return { policyId: order.policy.id }
    if (order.status !== OrderStatus.PAID) throw new AppException('ORDER_INVALID_TRANSITION')

    await this.orders.transition(order.id, OrderStatus.ISSUING, OrderStatus.PAID)

    try {
      const { insurer, quote } = order.quoteOffer
      const strategy = this.registry.get(quote.product.type)
      const period = strategy.coveragePeriod(strategy.parse(quote.input, { now }))

      const policyNumber = await this.nextPolicyNumber(
        insurer.id,
        insurer.slug,
        quote.product.type,
        now,
      )

      await this.issueWithInsurer(policyNumber)

      const policy = await this.prisma.policy.create({
        data: {
          orderId: order.id,
          insurerId: insurer.id,
          policyNumber,
          startsAt: period.startsAt,
          endsAt: period.endsAt,
          /*
           * Everything needed to render this policy forever, copied rather than referenced.
           * Rate tables get replaced and profiles get edited; an issued policy must still show
           * exactly what was sold.
           */
          dataSnapshot: {
            productSlug: quote.product.slug,
            productTitleFa: quote.product.titleFa,
            productType: quote.product.type,
            insurerName: insurer.name,
            insurerSlug: insurer.slug,
            insured: order.insuredSnapshot,
            quoteInput: quote.input,
            coverages: order.quoteOffer.coverages,
            lineItems: order.quoteOffer.lineItems,
            netPremium: order.quoteOffer.netPremium,
            totalAmount: order.amount,
            issuedAtIso: now.toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      })

      await this.orders.transition(order.id, OrderStatus.ISSUED, OrderStatus.ISSUING)

      await this.notifications.send(order.user.mobile, 'POLICY_ISSUED', {
        policyNumber,
        productTitleFa: quote.product.titleFa,
      })

      this.logger.log({ orderId: order.id, policyNumber }, 'Policy issued')
      return { policyId: policy.id }
    } catch (error) {
      // The customer has paid. Park the order for support rather than losing the money.
      this.logger.error({ err: error, orderId: order.id }, 'Issuance failed')
      await this.orders
        .transition(order.id, OrderStatus.ISSUE_FAILED, OrderStatus.ISSUING)
        .catch(() => undefined)
      throw new AppException('ISSUE_FAILED')
    }
  }

  /**
   * Atomically reserves the next number for this insurer and period.
   *
   * `INSERT … ON CONFLICT DO UPDATE … RETURNING` in one statement: two concurrent issuances
   * cannot be handed the same number, which a read-then-write would eventually do — and a
   * duplicate policy number is the kind of thing an insurer notices.
   */
  private async nextPolicyNumber(
    insurerId: string,
    insurerSlug: string,
    productType: string,
    now: Date,
  ): Promise<string> {
    const period = jalaliPeriod(now)

    const rows = await this.prisma.$queryRaw<{ lastNumber: number }[]>`
      INSERT INTO "PolicyCounter" ("insurerId", period, "lastNumber")
      VALUES (${insurerId}, ${period}, 1)
      ON CONFLICT ("insurerId", period)
      DO UPDATE SET "lastNumber" = "PolicyCounter"."lastNumber" + 1
      RETURNING "lastNumber"
    `

    const sequence = rows[0]?.lastNumber
    if (sequence === undefined) throw new Error('Policy counter returned no row')

    return formatPolicyNumber({ insurerSlug, productType, period, sequence })
  }

  /**
   * Stands in for registering the policy with the insurer (and, later, SANHAB).
   *
   * Deliberately async with its own failure path so the real integration drops in here without
   * restructuring anything around it.
   */
  private async issueWithInsurer(policyNumber: string): Promise<void> {
    this.logger.debug({ policyNumber }, 'Simulated insurer issuance')
  }
}

export function policyStatus(startsAt: Date, endsAt: Date, now: Date): PolicyStatus {
  if (now < startsAt) return 'UPCOMING'
  if (now > endsAt) return 'EXPIRED'
  return 'ACTIVE'
}
