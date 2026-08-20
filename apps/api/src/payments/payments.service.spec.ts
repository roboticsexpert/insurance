import { Test } from '@nestjs/testing'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { OrdersService } from '../orders/orders.service'
import { PoliciesService } from '../policies/policies.service'
import { PrismaService } from '../prisma/prisma.service'
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment-gateway'
import { PaymentsService } from './payments.service'

const NOW = new Date('2026-08-20T10:00:00Z')

const orderRow = (over: Record<string, unknown> = {}) => ({
  id: 'o1',
  userId: 'u1',
  status: OrderStatus.PENDING_PAYMENT,
  amount: 3_838_100,
  expiresAt: new Date(NOW.getTime() + 20 * 60_000),
  quoteOffer: { quote: { product: { titleFa: 'بیمه مسافرتی' } } },
  ...over,
})

describe('PaymentsService.start', () => {
  const orderFindUnique = jest.fn()
  const orderUpdateMany = jest.fn()
  const paymentCreate = jest.fn()
  let gateway: jest.Mocked<PaymentGateway>
  let service: PaymentsService

  beforeEach(async () => {
    jest.clearAllMocks()
    orderFindUnique.mockResolvedValue(orderRow())
    orderUpdateMany.mockResolvedValue({ count: 1 })
    paymentCreate.mockResolvedValue({})
    gateway = {
      name: 'mock',
      request: jest.fn().mockResolvedValue({ authority: 'A1', redirectUrl: 'http://gw/pay?a=A1' }),
      verify: jest.fn(),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            order: { findUnique: orderFindUnique, updateMany: orderUpdateMany },
            payment: { create: paymentCreate },
          },
        },
        { provide: OrdersService, useValue: { transition: jest.fn() } },
        { provide: PoliciesService, useValue: { issueForOrder: jest.fn() } },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    service = moduleRef.get(PaymentsService)
  })

  it('opens an attempt and returns the redirect', async () => {
    const result = await service.start('o1', 'u1', NOW)

    expect(result).toEqual({ authority: 'A1', redirectUrl: 'http://gw/pay?a=A1' })
    expect(gateway.request).toHaveBeenCalledWith({
      orderId: 'o1',
      amount: 3_838_100,
      descriptionFa: 'بیمه مسافرتی — ۳۸۳٬۸۱۰ تومان',
    })
    expect(paymentCreate.mock.calls[0][0].data).toMatchObject({
      orderId: 'o1',
      gateway: 'mock',
      authority: 'A1',
      amount: 3_838_100,
      status: PaymentStatus.CREATED,
    })
  })

  // A declined card should not cost the customer their quote.
  it('lets a declined order be retried, moving it back to payable', async () => {
    orderFindUnique.mockResolvedValue(orderRow({ status: OrderStatus.PAYMENT_FAILED }))
    await service.start('o1', 'u1', NOW)

    expect(paymentCreate).toHaveBeenCalled()
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: { id: 'o1', status: OrderStatus.PAYMENT_FAILED },
      data: { status: OrderStatus.PENDING_PAYMENT },
    })
  })

  it.each([
    ['already paid', OrderStatus.PAID, 'ORDER_ALREADY_PAID'],
    ['already issued', OrderStatus.ISSUED, 'ORDER_ALREADY_PAID'],
    ['mid-issuance', OrderStatus.ISSUING, 'ORDER_INVALID_TRANSITION'],
    ['cancelled', OrderStatus.CANCELLED, 'ORDER_INVALID_TRANSITION'],
  ])('refuses to charge an order that is %s', async (_label, status, code) => {
    orderFindUnique.mockResolvedValue(orderRow({ status }))
    await expect(service.start('o1', 'u1', NOW)).rejects.toMatchObject({ code })
    expect(gateway.request).not.toHaveBeenCalled()
  })

  it('refuses an expired order', async () => {
    orderFindUnique.mockResolvedValue(orderRow({ expiresAt: new Date(NOW.getTime() - 1000) }))
    await expect(service.start('o1', 'u1', NOW)).rejects.toMatchObject({ code: 'ORDER_EXPIRED' })
  })

  it('refuses to charge somebody else’s order', async () => {
    orderFindUnique.mockResolvedValue(orderRow({ userId: 'u2' }))
    await expect(service.start('o1', 'u1', NOW)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(gateway.request).not.toHaveBeenCalled()
  })
})
