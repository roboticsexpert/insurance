import { Test } from '@nestjs/testing'
import { ENV } from '../config/config.module'
import { NotificationsService } from '../notifications/notifications.service'
import { OrdersService } from '../orders/orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { RatingRegistry } from '../rating/rating.registry'
import { PoliciesService, policyStatus } from './policies.service'

const NOW = new Date('2026-08-20T10:00:00Z')

const policyRow = (over: Record<string, unknown> = {}) => ({
  id: 'pol1',
  policyNumber: 'DEY-TRV-0505-000042',
  startsAt: new Date('2026-10-02T00:00:00Z'),
  endsAt: new Date('2026-10-12T23:59:59Z'),
  issuedAt: NOW,
  insurer: {
    id: 'i1', slug: 'dey', name: 'بیمه دی', logoUrl: null,
    solvencyLevel: 2, claimSatisfaction: 79, branchCount: 240,
  },
  order: { amount: 3_838_100, userId: 'u1' },
  dataSnapshot: {
    productType: 'TRAVEL',
    productTitleFa: 'بیمه مسافرتی',
    insurerName: 'بیمه دی',
    insured: [{ firstName: 'مهدی', lastName: 'یوسف‌تبار' }],
    coverages: [{ key: 'medical', labelFa: 'درمان', valueFa: '۳۰ هزار یورو' }],
    lineItems: [{ key: 'base', labelFa: 'پایه', amount: 3_471_000, kind: 'PREMIUM' }],
  },
  ...over,
})

describe('policyStatus', () => {
  const starts = new Date('2026-10-02T00:00:00Z')
  const ends = new Date('2026-10-12T23:59:59Z')

  /*
   * Three states matter: a trip policy bought in August for October is neither expired nor in
   * force. Calling it "active" is a lie the customer discovers at the airport.
   */
  it.each([
    ['before it starts', '2026-08-20T10:00:00Z', 'UPCOMING'],
    ['on the first day', '2026-10-02T09:00:00Z', 'ACTIVE'],
    ['mid-trip', '2026-10-07T00:00:00Z', 'ACTIVE'],
    ['on the last day', '2026-10-12T20:00:00Z', 'ACTIVE'],
    ['after it ends', '2026-10-13T00:00:00Z', 'EXPIRED'],
  ])('is %s → %s', (_label, iso, expected) => {
    expect(policyStatus(starts, ends, new Date(iso))).toBe(expected)
  })
})

describe('PoliciesService listing', () => {
  const findMany = jest.fn()
  const findUnique = jest.fn()
  let service: PoliciesService

  beforeEach(async () => {
    jest.clearAllMocks()
    findMany.mockResolvedValue([policyRow()])
    findUnique.mockResolvedValue(policyRow())

    const moduleRef = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: PrismaService, useValue: { policy: { findMany, findUnique } } },
        { provide: OrdersService, useValue: {} },
        { provide: RatingRegistry, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: ENV, useValue: { WEB_URL: 'https://app.bime247.com' } },
      ],
    }).compile()
    service = moduleRef.get(PoliciesService)
  })

  it('lists only the caller’s policies, newest first', async () => {
    await service.listForUser('u1', NOW)
    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: { order: { userId: 'u1' } },
      orderBy: { issuedAt: 'desc' },
    })
  })

  it('labels status in Persian', async () => {
    const [item] = await service.listForUser('u1', NOW)
    expect(item).toMatchObject({
      policyNumber: 'DEY-TRV-0505-000042',
      status: 'UPCOMING',
      statusFa: 'شروع نشده',
      amount: 3_838_100,
    })
  })

  /*
   * Titles come from the snapshot, so a policy still reads correctly after its product was
   * renamed or withdrawn from sale.
   */
  it('takes the product title from the snapshot, not the live product', async () => {
    const [item] = await service.listForUser('u1', NOW)
    expect(item?.productTitleFa).toBe('بیمه مسافرتی')
  })

  it('falls back gracefully when a snapshot predates a field', async () => {
    findMany.mockResolvedValue([policyRow({ dataSnapshot: {} })])
    const [item] = await service.listForUser('u1', NOW)
    expect(item?.productTitleFa).toBe('بیمه‌نامه')
    expect(item?.insurerName).toBe('بیمه دی') // falls back to the live insurer row
  })

  describe('detail', () => {
    it('includes the insured, coverages and premium lines', async () => {
      const detail = await service.findForUser('pol1', 'u1', NOW)
      expect(detail.insured).toHaveLength(1)
      expect(detail.coverages[0]?.valueFa).toBe('۳۰ هزار یورو')
      expect(detail.lineItems[0]?.amount).toBe(3_471_000)
      expect(detail.documentUrl).toBe('/policies/pol1/document')
    })

    it('refuses someone else’s policy', async () => {
      findUnique.mockResolvedValue(policyRow({ order: { amount: 1, userId: 'u2' } }))
      await expect(service.findForUser('pol1', 'u1', NOW)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('reports NOT_FOUND for an unknown id', async () => {
      findUnique.mockResolvedValue(null)
      await expect(service.findForUser('nope', 'u1', NOW)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('survives a snapshot with nothing in it', async () => {
      findUnique.mockResolvedValue(policyRow({ dataSnapshot: null }))
      const detail = await service.findForUser('pol1', 'u1', NOW)
      expect(detail.insured).toEqual([])
      expect(detail.coverages).toEqual([])
    })
  })
})
