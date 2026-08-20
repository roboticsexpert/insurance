import { Test } from '@nestjs/testing'
import { OrderStatus } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from './orders.service'

const NOW = new Date('2026-08-20T10:00:00Z')
const KEY = '11111111-2222-3333-4444-555555555555'

const insured = (birthDate = '1990-05-20', over = {}) => ({
  firstName: 'مهدی',
  lastName: 'یوسف‌تبار',
  nationalCode: '0499370899',
  birthDate,
  passportNo: 'A1234567',
  ...over,
})

const offerRow = (over: Record<string, unknown> = {}) => ({
  id: 'off1',
  totalAmount: 2_500_000,
  isEligible: true,
  ineligibleReasonFa: null,
  quote: {
    id: 'q1',
    userId: 'u1',
    expiresAt: new Date(NOW.getTime() + 10 * 60_000),
    input: { travelers: [{ birthDate: '1990-05-20' }] },
  },
  ...over,
})

const orderRow = (over: Record<string, unknown> = {}) => ({
  id: 'o1',
  userId: 'u1',
  status: OrderStatus.PENDING_PAYMENT,
  amount: 2_500_000,
  createdAt: NOW,
  expiresAt: new Date(NOW.getTime() + 30 * 60_000),
  policy: null,
  quoteOffer: {
    id: 'off1',
    insurer: {
      id: 'i1', slug: 'dey', name: 'بیمه دی', logoUrl: null,
      solvencyLevel: 2, claimSatisfaction: 79, branchCount: 240,
    },
    quote: { id: 'q1', product: { slug: 'travel', titleFa: 'بیمه مسافرتی', type: 'TRAVEL' } },
  },
  ...over,
})

describe('OrdersService', () => {
  const orderFindUnique = jest.fn()
  const orderCreate = jest.fn()
  const orderUpdateMany = jest.fn()
  const offerFindUnique = jest.fn()
  const quoteUpdate = jest.fn()
  let service: OrdersService

  beforeEach(async () => {
    jest.clearAllMocks()
    orderFindUnique.mockResolvedValue(null)
    orderCreate.mockResolvedValue(orderRow())
    orderUpdateMany.mockResolvedValue({ count: 1 })
    offerFindUnique.mockResolvedValue(offerRow())

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: { findUnique: orderFindUnique, create: orderCreate, updateMany: orderUpdateMany },
            quoteOffer: { findUnique: offerFindUnique },
            quote: { update: quoteUpdate },
          },
        },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    service = moduleRef.get(OrdersService)
  })

  const create = (over: Record<string, unknown> = {}) =>
    service.create('u1', { quoteOfferId: 'off1', insured: [insured()], idempotencyKey: KEY, ...over }, NOW)

  describe('create', () => {
    it('places an order at the frozen price, payable for 30 minutes', async () => {
      await create()
      const data = orderCreate.mock.calls[0][0].data
      expect(data).toMatchObject({
        userId: 'u1',
        quoteOfferId: 'off1',
        status: OrderStatus.PENDING_PAYMENT,
        amount: 2_500_000,
        idempotencyKey: KEY,
      })
      expect(data.expiresAt).toEqual(new Date(NOW.getTime() + 30 * 60_000))
    })

    it('snapshots the insured, so later profile edits cannot change a placed order', async () => {
      await create()
      expect(orderCreate.mock.calls[0][0].data.insuredSnapshot).toEqual([insured()])
    })

    /*
     * Idempotency runs before validation on purpose: a retried request must return the original
     * order even after the quote expired, or a flaky network becomes an unresolvable error.
     */
    it('returns the original order for a repeated idempotency key', async () => {
      orderFindUnique.mockResolvedValue(orderRow())
      const result = await create()

      expect(result.id).toBe('o1')
      expect(orderCreate).not.toHaveBeenCalled()
      expect(offerFindUnique).not.toHaveBeenCalled()
    })

    it('refuses a key that belongs to somebody else', async () => {
      orderFindUnique.mockResolvedValue(orderRow({ userId: 'someone-else' }))
      await expect(create()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('refuses an expired quote', async () => {
      offerFindUnique.mockResolvedValue(
        offerRow({ quote: { ...offerRow().quote, expiresAt: new Date(NOW.getTime() - 1000) } }),
      )
      await expect(create()).rejects.toMatchObject({ code: 'QUOTE_EXPIRED' })
    })

    it('refuses someone else’s quote', async () => {
      offerFindUnique.mockResolvedValue(
        offerRow({ quote: { ...offerRow().quote, userId: 'u2' } }),
      )
      await expect(create()).rejects.toMatchObject({ code: 'QUOTE_NOT_YOURS' })
    })

    it('refuses an offer the insurer declined, repeating their reason', async () => {
      offerFindUnique.mockResolvedValue(
        offerRow({ isEligible: false, ineligibleReasonFa: 'سن بالای حد مجاز' }),
      )
      const error = await create().catch((e: AppException) => e)
      expect((error as AppException).message).toBe('سن بالای حد مجاز')
    })

    it('claims an anonymous quote for the buyer', async () => {
      offerFindUnique.mockResolvedValue(offerRow({ quote: { ...offerRow().quote, userId: null } }))
      await create()
      expect(quoteUpdate).toHaveBeenCalledWith({ where: { id: 'q1' }, data: { userId: 'u1' } })
    })

    describe('the insured must be who was priced', () => {
      /*
       * Age drives the premium. Quoting a 30-year-old and insuring an 80-year-old would sell
       * cover at a price the insurer never agreed to.
       */
      it('refuses a different date of birth', async () => {
        const error = await create({ insured: [insured('1945-01-01')] }).catch((e: AppException) => e)
        expect((error as AppException).code).toBe('VALIDATION_FAILED')
        expect((error as AppException).fields?.insured).toContain('تاریخ تولد')
        expect(orderCreate).not.toHaveBeenCalled()
      })

      it('refuses a different number of people', async () => {
        await expect(create({ insured: [insured(), insured()] })).rejects.toMatchObject({
          code: 'VALIDATION_FAILED',
        })
      })

      it('accepts the same people listed in a different order', async () => {
        offerFindUnique.mockResolvedValue(
          offerRow({
            quote: {
              ...offerRow().quote,
              input: { travelers: [{ birthDate: '1990-05-20' }, { birthDate: '2010-01-01' }] },
            },
          }),
        )
        await expect(
          create({ insured: [insured('2010-01-01'), insured('1990-05-20')] }),
        ).resolves.toBeDefined()
      })
    })
  })

  describe('transition', () => {
    it('guards the update on the current status, so a lost race cannot double-move', async () => {
      await service.transition('o1', OrderStatus.PAID, OrderStatus.PENDING_PAYMENT)
      expect(orderUpdateMany).toHaveBeenCalledWith({
        where: { id: 'o1', status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PAID },
      })
    })

    // Payment callbacks arrive twice more often than anyone expects.
    it('rejects a transition that updated no rows', async () => {
      orderUpdateMany.mockResolvedValue({ count: 0 })
      await expect(
        service.transition('o1', OrderStatus.PAID, OrderStatus.PENDING_PAYMENT),
      ).rejects.toMatchObject({ code: 'ORDER_INVALID_TRANSITION' })
    })

    it('refuses an illegal transition before touching the database', async () => {
      await expect(
        service.transition('o1', OrderStatus.ISSUED, OrderStatus.PENDING_PAYMENT),
      ).rejects.toMatchObject({ code: 'ORDER_INVALID_TRANSITION' })
      expect(orderUpdateMany).not.toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('reports expiry only while the order is still payable', async () => {
      const stale = { expiresAt: new Date(NOW.getTime() - 1000) }
      orderFindUnique.mockResolvedValue(orderRow(stale))
      await expect(service.findById('o1', 'u1', NOW)).resolves.toMatchObject({ isExpired: true })

      orderFindUnique.mockResolvedValue(orderRow({ ...stale, status: OrderStatus.PAID }))
      await expect(service.findById('o1', 'u1', NOW)).resolves.toMatchObject({ isExpired: false })
    })

    it('refuses someone else’s order', async () => {
      orderFindUnique.mockResolvedValue(orderRow({ userId: 'u2' }))
      await expect(service.findById('o1', 'u1', NOW)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })
})
