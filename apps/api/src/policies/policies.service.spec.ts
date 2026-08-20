import { Test } from '@nestjs/testing'
import { OrderStatus } from '@prisma/client'
import { ENV } from '../config/config.module'
import { NotificationsService } from '../notifications/notifications.service'
import { OrdersService } from '../orders/orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { RatingRegistry } from '../rating/rating.registry'
import { PoliciesService } from './policies.service'

const NOW = new Date('2026-08-20T10:00:00Z')

const orderRow = (over: Record<string, unknown> = {}) => ({
  id: 'o1',
  status: OrderStatus.PAID,
  amount: 3_838_100,
  insuredSnapshot: [{ firstName: 'مهدی' }],
  policy: null,
  user: { mobile: '9121110000' },
  quoteOffer: {
    netPremium: 3_471_000,
    coverages: [{ key: 'medical' }],
    lineItems: [{ key: 'base' }],
    insurer: { id: 'i1', slug: 'dey', name: 'بیمه دی' },
    quote: {
      input: { startDate: '2026-10-02', endDate: '2026-10-12' },
      product: { slug: 'travel', titleFa: 'بیمه مسافرتی', type: 'TRAVEL' },
    },
  },
  ...over,
})

describe('PoliciesService.issueForOrder', () => {
  const orderFindUnique = jest.fn()
  const policyCreate = jest.fn()
  const queryRaw = jest.fn()
  const transition = jest.fn()
  const send = jest.fn()
  const strategy = {
    productType: 'TRAVEL',
    parse: jest.fn((i: unknown) => i),
    rate: jest.fn(),
    coveragePeriod: jest.fn(() => ({
      startsAt: new Date('2026-10-02T00:00:00Z'),
      endsAt: new Date('2026-10-12T23:59:59Z'),
    })),
  }
  let service: PoliciesService

  beforeEach(async () => {
    jest.clearAllMocks()
    orderFindUnique.mockResolvedValue(orderRow())
    policyCreate.mockResolvedValue({ id: 'pol1' })
    queryRaw.mockResolvedValue([{ lastNumber: 42 }])
    transition.mockResolvedValue(undefined)

    const moduleRef = await Test.createTestingModule({
      providers: [
        PoliciesService,
        {
          provide: PrismaService,
          useValue: { order: { findUnique: orderFindUnique }, policy: { create: policyCreate }, $queryRaw: queryRaw },
        },
        { provide: OrdersService, useValue: { transition } },
        { provide: RatingRegistry, useValue: { get: () => strategy } },
        { provide: NotificationsService, useValue: { send } },
        { provide: ENV, useValue: { WEB_URL: 'https://app.bime247.com' } },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    service = moduleRef.get(PoliciesService)
  })

  it('issues a numbered policy and walks the order to ISSUED', async () => {
    const result = await service.issueForOrder('o1', NOW)

    expect(transition.mock.calls[0]).toEqual(['o1', OrderStatus.ISSUING, OrderStatus.PAID])
    expect(transition.mock.calls[1]).toEqual(['o1', OrderStatus.ISSUED, OrderStatus.ISSUING])
    expect(policyCreate.mock.calls[0][0].data.policyNumber).toBe('DEY-TRV-0505-000042')
    expect(result).toEqual({ policyId: 'pol1' })
  })

  it('sets the cover period from the product, not from today', async () => {
    await service.issueForOrder('o1', NOW)
    const data = policyCreate.mock.calls[0][0].data
    expect(data.startsAt).toEqual(new Date('2026-10-02T00:00:00Z'))
    expect(data.endsAt).toEqual(new Date('2026-10-12T23:59:59Z'))
  })

  /*
   * Rate tables get replaced and profiles get edited. An issued policy has to keep showing
   * exactly what was sold, so everything is copied rather than referenced.
   */
  it('snapshots everything needed to render the policy forever', async () => {
    await service.issueForOrder('o1', NOW)
    expect(policyCreate.mock.calls[0][0].data.dataSnapshot).toMatchObject({
      productTitleFa: 'بیمه مسافرتی',
      insurerName: 'بیمه دی',
      insured: [{ firstName: 'مهدی' }],
      coverages: [{ key: 'medical' }],
      lineItems: [{ key: 'base' }],
      totalAmount: 3_838_100,
    })
  })

  it('texts the customer their policy number', async () => {
    await service.issueForOrder('o1', NOW)
    expect(send).toHaveBeenCalledWith('9121110000', 'POLICY_ISSUED', {
      policyNumber: 'DEY-TRV-0505-000042',
      productTitleFa: 'بیمه مسافرتی',
    })
  })

  // Replaying issuance must not mint a second policy for one payment.
  it('returns the existing policy instead of issuing twice', async () => {
    orderFindUnique.mockResolvedValue(orderRow({ policy: { id: 'already' }, status: OrderStatus.ISSUED }))
    await expect(service.issueForOrder('o1', NOW)).resolves.toEqual({ policyId: 'already' })
    expect(policyCreate).not.toHaveBeenCalled()
    expect(transition).not.toHaveBeenCalled()
  })

  it('refuses to issue an order that has not been paid', async () => {
    orderFindUnique.mockResolvedValue(orderRow({ status: OrderStatus.PENDING_PAYMENT }))
    await expect(service.issueForOrder('o1', NOW)).rejects.toMatchObject({
      code: 'ORDER_INVALID_TRANSITION',
    })
  })

  // The customer has paid; the order must be parked for support, not silently lost.
  it('parks the order in ISSUE_FAILED when issuance breaks', async () => {
    policyCreate.mockRejectedValue(new Error('db down'))

    await expect(service.issueForOrder('o1', NOW)).rejects.toMatchObject({ code: 'ISSUE_FAILED' })
    expect(transition).toHaveBeenLastCalledWith('o1', OrderStatus.ISSUE_FAILED, OrderStatus.ISSUING)
  })

  it('reserves the number in a single atomic statement', async () => {
    await service.issueForOrder('o1', NOW)
    // A tagged template passes its strings array as the first argument.
    const sql = (queryRaw.mock.calls[0][0] as string[]).join(' ')
    expect(sql).toContain('ON CONFLICT')
    expect(sql).toContain('RETURNING')
  })
})
