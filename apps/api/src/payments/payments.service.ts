import { Inject, Injectable, Logger } from '@nestjs/common'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { formatToman } from '../common/fa'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { PoliciesService } from '../policies/policies.service'
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment-gateway'
import type { VerifyPaymentDto, VerifyPaymentResponse } from './payments.dto'

export interface StartPaymentResult {
  redirectUrl: string
  authority: string
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly policies: PoliciesService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  /**
   * Opens a payment attempt for an order and returns where to send the customer.
   *
   * Deliberately allows more than one attempt per order: a customer whose card is declined
   * should be able to try again without re-quoting. Each attempt is its own `Payment` row with
   * its own authority, so the history stays auditable.
   */
  async start(orderId: string, userId: string, now = new Date()): Promise<StartPaymentResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { quoteOffer: { include: { quote: { include: { product: true } } } } },
    })

    if (!order) throw new AppException('NOT_FOUND')
    if (order.userId !== userId) throw new AppException('FORBIDDEN')

    if (order.status === OrderStatus.PAID || order.status === OrderStatus.ISSUED) {
      throw new AppException('ORDER_ALREADY_PAID')
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.PAYMENT_FAILED) {
      throw new AppException('ORDER_INVALID_TRANSITION')
    }
    if (order.expiresAt && order.expiresAt <= now) {
      throw new AppException('ORDER_EXPIRED')
    }

    const { authority, redirectUrl } = await this.gateway.request({
      orderId: order.id,
      amount: order.amount,
      descriptionFa: `${order.quoteOffer.quote.product.titleFa} — ${formatToman(order.amount)}`,
    })

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: this.gateway.name,
        authority,
        amount: order.amount,
        status: PaymentStatus.CREATED,
      },
    })

    // A retry after a decline moves the order back to payable.
    if (order.status === OrderStatus.PAYMENT_FAILED) {
      await this.prisma.order.updateMany({
        where: { id: order.id, status: OrderStatus.PAYMENT_FAILED },
        data: { status: OrderStatus.PENDING_PAYMENT },
      })
    }

    this.logger.log({ orderId: order.id, authority }, 'Payment attempt opened')
    return { authority, redirectUrl }
  }

  /**
   * The **only** place an order becomes PAID.
   *
   * Deliberately requires no session. The money moved whether or not the customer's browser
   * made it back — they may have closed the tab, lost signal, or paid in a banking app that
   * never returns. The authority is an unguessable capability, so a retry, a second tab, or a
   * future reconciliation job can all drive this same path.
   *
   * Safe to call any number of times: the first call decides, every later one reports what was
   * decided.
   */
  async verify(dto: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { authority: dto.authority },
      include: { order: { include: { policy: { select: { id: true } } } } },
    })
    if (!payment) throw new AppException('NOT_FOUND')

    // Already settled: report the original decision rather than asking the gateway again.
    if (payment.status !== PaymentStatus.CREATED && payment.status !== PaymentStatus.REDIRECTED) {
      return this.describe(payment.orderId, payment.status, payment.refId)
    }

    const result = await this.gateway.verify({ authority: dto.authority, status: dto.status })

    if (!result.ok) {
      await this.settleFailure(payment.id, payment.orderId, payment.order.status)
      return this.describe(payment.orderId, PaymentStatus.FAILED, null, result.reasonFa)
    }

    /*
     * Claim the payment atomically. Two callbacks arriving together — a retried redirect, a
     * double-tapped browser back button — must not both flip the order to PAID and issue two
     * policies. The loser updates zero rows and simply reads the winner's outcome.
     */
    const claimed = await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { in: [PaymentStatus.CREATED, PaymentStatus.REDIRECTED] } },
      data: {
        status: PaymentStatus.SUCCEEDED,
        refId: result.refId ?? null,
        cardMask: result.cardMask ?? null,
        verifiedAt: new Date(),
      },
    })

    if (claimed.count !== 1) {
      const settled = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })
      return this.describe(settled.orderId, settled.status, settled.refId)
    }

    await this.orders.transition(payment.orderId, OrderStatus.PAID, OrderStatus.PENDING_PAYMENT)
    this.logger.log({ orderId: payment.orderId, refId: result.refId }, 'Payment verified')

    /*
     * Issuance failing must not fail this response. The payment succeeded, and telling the
     * customer otherwise would be a lie that also loses their receipt. `issueForOrder` parks
     * the order in ISSUE_FAILED for support; `describe` then reports the real state.
     */
    await this.policies
      .issueForOrder(payment.orderId)
      .catch((error: unknown) =>
        this.logger.error({ err: error, orderId: payment.orderId }, 'Issuance after payment failed'),
      )

    return this.describe(payment.orderId, PaymentStatus.SUCCEEDED, result.refId ?? null)
  }

  private async settleFailure(
    paymentId: string,
    orderId: string,
    orderStatus: OrderStatus,
  ): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { id: paymentId, status: { in: [PaymentStatus.CREATED, PaymentStatus.REDIRECTED] } },
      data: { status: PaymentStatus.FAILED, verifiedAt: new Date() },
    })

    // The order stays usable so the customer can try a different card.
    if (orderStatus === OrderStatus.PENDING_PAYMENT) {
      await this.prisma.order
        .updateMany({
          where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
          data: { status: OrderStatus.PAYMENT_FAILED },
        })
        .catch((error: unknown) => this.logger.error({ err: error, orderId }, 'Could not mark order failed'))
    }
  }

  private async describe(
    orderId: string,
    paymentStatus: PaymentStatus,
    refId: string | null,
    reasonFa?: string,
  ): Promise<VerifyPaymentResponse> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        policy: { select: { id: true } },
        quoteOffer: { select: { id: true, quoteId: true, quote: { select: { product: true } } } },
      },
    })

    return {
      orderId,
      quoteId: order.quoteOffer.quoteId,
      quoteOfferId: order.quoteOffer.id,
      productTitleFa: order.quoteOffer.quote.product.titleFa,
      amount: order.amount,
      orderStatus: order.status,
      paymentStatus,
      refId,
      policyId: order.policy?.id ?? null,
      messageFa:
        paymentStatus === PaymentStatus.SUCCEEDED
          ? 'پرداخت با موفقیت انجام شد.'
          : (reasonFa ?? 'پرداخت انجام نشد.'),
    }
  }
}
