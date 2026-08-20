import { Test } from '@nestjs/testing'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { OrdersService } from '../orders/orders.service'
import { PoliciesService } from '../policies/policies.service'
import { PrismaService } from '../prisma/prisma.service'
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment-gateway'
import { PaymentsService } from './payments.service'

const orderDetail = (over: Record<string, unknown> = {}) => ({
  status: OrderStatus.PAID,
  amount: 3_838_100,
  policy: null,
  quoteOffer: { id: 'off1', quoteId: 'q1', quote: { product: { titleFa: 'بیمه مسافرتی' } } },
  ...over,
})

const paymentRow = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  orderId: 'o1',
  authority: 'A1',
  status: PaymentStatus.REDIRECTED,
  refId: null,
  order: { status: OrderStatus.PENDING_PAYMENT, policy: null },
  ...over,
})

describe('PaymentsService.verify', () => {
  const paymentFindUnique = jest.fn()
  const paymentFindUniqueOrThrow = jest.fn()
  const paymentUpdateMany = jest.fn()
  const orderFindUniqueOrThrow = jest.fn()
  const orderUpdateMany = jest.fn()
  const transition = jest.fn()
  const issueForOrder = jest.fn()
  let gateway: jest.Mocked<PaymentGateway>
  let service: PaymentsService

  beforeEach(async () => {
    jest.clearAllMocks()
    paymentFindUnique.mockResolvedValue(paymentRow())
    paymentUpdateMany.mockResolvedValue({ count: 1 })
    orderUpdateMany.mockResolvedValue({ count: 1 })
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail())
    transition.mockResolvedValue(undefined)
    issueForOrder.mockResolvedValue({ policyId: 'pol1' })
    gateway = {
      name: 'mock',
      request: jest.fn(),
      verify: jest.fn().mockResolvedValue({ ok: true, refId: '123456789', cardMask: '6037-**' }),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findUnique: paymentFindUnique,
              findUniqueOrThrow: paymentFindUniqueOrThrow,
              updateMany: paymentUpdateMany,
              create: jest.fn(),
            },
            order: {
              findUnique: jest.fn(),
              findUniqueOrThrow: orderFindUniqueOrThrow,
              updateMany: orderUpdateMany,
            },
          },
        },
        { provide: OrdersService, useValue: { transition } },
        { provide: PoliciesService, useValue: { issueForOrder } },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    service = moduleRef.get(PaymentsService)
  })

  it('marks the payment succeeded and moves the order to PAID', async () => {
    const result = await service.verify({ authority: 'A1', status: 'OK' })

    expect(paymentUpdateMany.mock.calls[0][0].data).toMatchObject({
      status: PaymentStatus.SUCCEEDED,
      refId: '123456789',
      cardMask: '6037-**',
    })
    expect(transition).toHaveBeenCalledWith('o1', OrderStatus.PAID, OrderStatus.PENDING_PAYMENT)
    expect(result).toMatchObject({
      orderId: 'o1',
      paymentStatus: PaymentStatus.SUCCEEDED,
      refId: '123456789',
      messageFa: 'پرداخت با موفقیت انجام شد.',
    })
  })

  /*
   * The claim is guarded on the payment still being unsettled. Two callbacks arriving together
   * — a retried redirect, a double-tapped back button — must not both move the order.
   */
  it('claims the payment atomically, guarded on it being unsettled', async () => {
    await service.verify({ authority: 'A1' })
    expect(paymentUpdateMany.mock.calls[0][0].where).toEqual({
      id: 'p1',
      status: { in: [PaymentStatus.CREATED, PaymentStatus.REDIRECTED] },
    })
  })

  it('reports the winner’s outcome when it loses the race, without touching the order', async () => {
    paymentUpdateMany.mockResolvedValue({ count: 0 })
    paymentFindUniqueOrThrow.mockResolvedValue({
      orderId: 'o1',
      status: PaymentStatus.SUCCEEDED,
      refId: 'winner-ref',
    })

    const result = await service.verify({ authority: 'A1' })
    expect(result.refId).toBe('winner-ref')
    expect(transition).not.toHaveBeenCalled()
  })

  // Replaying a callback must not re-verify or issue a second time.
  it('is idempotent: a settled payment reports its original outcome', async () => {
    paymentFindUnique.mockResolvedValue(
      paymentRow({ status: PaymentStatus.SUCCEEDED, refId: '999', order: { status: OrderStatus.ISSUED, policy: { id: 'pol1' } } }),
    )
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: OrderStatus.ISSUED, policy: { id: 'pol1' } }))

    const result = await service.verify({ authority: 'A1' })

    expect(gateway.verify).not.toHaveBeenCalled()
    expect(paymentUpdateMany).not.toHaveBeenCalled()
    expect(transition).not.toHaveBeenCalled()
    expect(result).toMatchObject({ refId: '999', policyId: 'pol1' })
  })

  it('reports a previously failed payment without retrying it', async () => {
    paymentFindUnique.mockResolvedValue(paymentRow({ status: PaymentStatus.FAILED }))
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: OrderStatus.PAYMENT_FAILED }))

    const result = await service.verify({ authority: 'A1' })
    expect(gateway.verify).not.toHaveBeenCalled()
    expect(result.paymentStatus).toBe(PaymentStatus.FAILED)
  })

  describe('when the gateway declines', () => {
    beforeEach(() => {
      gateway.verify.mockResolvedValue({ ok: false, reasonFa: 'پرداخت توسط بانک تأیید نشد.' })
      orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: OrderStatus.PAYMENT_FAILED }))
    })

    it('never moves the order to PAID', async () => {
      const result = await service.verify({ authority: 'A1', status: 'NOK' })
      expect(transition).not.toHaveBeenCalled()
      expect(result.messageFa).toBe('پرداخت توسط بانک تأیید نشد.')
    })

    // The order stays alive so the customer can try a different card.
    it('leaves the order retryable rather than cancelling it', async () => {
      await service.verify({ authority: 'A1' })
      expect(orderUpdateMany).toHaveBeenCalledWith({
        where: { id: 'o1', status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PAYMENT_FAILED },
      })
    })
  })

  /*
   * The gateway is the authority on whether money moved. A crafted `Status=OK` reaches here,
   * but the gateway's own verification is what decides.
   */
  it('does not let a crafted Status=OK override the gateway', async () => {
    gateway.verify.mockResolvedValue({ ok: false, reasonFa: 'پرداخت تکمیل نشد.' })
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: OrderStatus.PAYMENT_FAILED }))

    const result = await service.verify({ authority: 'A1', status: 'OK' })
    expect(result.paymentStatus).toBe(PaymentStatus.FAILED)
    expect(transition).not.toHaveBeenCalled()
  })

  it('issues the policy once the payment is confirmed', async () => {
    await service.verify({ authority: 'A1' })
    expect(issueForOrder).toHaveBeenCalledWith('o1')
  })

  /*
   * The money is already taken. Reporting a payment failure because issuance broke would be a
   * lie that also costs the customer their receipt.
   */
  it('still reports the payment succeeded when issuance fails', async () => {
    issueForOrder.mockRejectedValue(new Error('insurer down'))
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: 'ISSUE_FAILED' }))

    const result = await service.verify({ authority: 'A1' })
    expect(result.paymentStatus).toBe(PaymentStatus.SUCCEEDED)
    expect(result.refId).toBe('123456789')
    expect(result.orderStatus).toBe('ISSUE_FAILED')
  })

  it('does not re-issue when replaying a settled payment', async () => {
    paymentFindUnique.mockResolvedValue(
      paymentRow({ status: PaymentStatus.SUCCEEDED, refId: '999', order: { status: OrderStatus.ISSUED, policy: { id: 'pol1' } } }),
    )
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: OrderStatus.ISSUED, policy: { id: 'pol1' } }))
    await service.verify({ authority: 'A1' })
    expect(issueForOrder).not.toHaveBeenCalled()
  })

  // Without these a declined customer has no route back to checkout, and the sale is lost.
  it('returns what a failure screen needs to offer a retry', async () => {
    gateway.verify.mockResolvedValue({ ok: false, reasonFa: 'رد شد' })
    orderFindUniqueOrThrow.mockResolvedValue(orderDetail({ status: OrderStatus.PAYMENT_FAILED }))

    const result = await service.verify({ authority: 'A1' })
    expect(result).toMatchObject({
      quoteId: 'q1',
      quoteOfferId: 'off1',
      productTitleFa: 'بیمه مسافرتی',
      amount: 3_838_100,
    })
  })

  it('rejects an unknown authority', async () => {
    paymentFindUnique.mockResolvedValue(null)
    await expect(service.verify({ authority: 'nope' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
