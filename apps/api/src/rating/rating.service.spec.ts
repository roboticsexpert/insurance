import { Test } from '@nestjs/testing'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { PremiumBuilder } from './pricing'
import { RATING_STRATEGIES, type RatingStrategy } from './rating-strategy'
import { RatingRegistry } from './rating.registry'
import { RatingService } from './rating.service'

const NOW = new Date('2026-08-20T10:00:00Z')

const offering = (id: string, slug: string) => ({
  id,
  productId: 'p1',
  insurerId: `i-${slug}`,
  isActive: true,
  sortWeight: 0,
  featuresFa: [],
  insurer: { id: `i-${slug}`, slug, name: slug, isActive: true },
})

const table = (source: string) => ({ meta: { source }, base: 1_000_000 })

describe('RatingService', () => {
  const productFindFirst = jest.fn()
  const productFindMany = jest.fn()
  const productUpdate = jest.fn()
  const offeringFindMany = jest.fn()
  const rateTableFindMany = jest.fn()

  const strategy: RatingStrategy<{ ok: true }> = {
    productType: 'TRAVEL',
    parse: jest.fn((input: unknown) => {
      if ((input as { bad?: boolean })?.bad) throw new AppException('VALIDATION_FAILED')
      return { ok: true }
    }),
    rate: jest.fn((_input, t: unknown) =>
      new PremiumBuilder()
        .premium('base', 'پایه', (t as { base: number }).base)
        .toResult([]),
    ),
    coveragePeriod: () => ({ startsAt: NOW, endsAt: NOW }),
  }

  const build = async (strategies: RatingStrategy[] = [strategy]) => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RatingService,
        RatingRegistry,
        { provide: RATING_STRATEGIES, useValue: strategies },
        {
          provide: PrismaService,
          useValue: {
            product: {
              findFirst: productFindFirst,
              findMany: productFindMany,
              update: productUpdate,
            },
            offering: { findMany: offeringFindMany },
            rateTable: { findMany: rateTableFindMany },
          },
        },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    return moduleRef.get(RatingService)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    productFindFirst.mockResolvedValue({ id: 'p1', slug: 'travel', type: 'TRAVEL', isActive: true })
    offeringFindMany.mockResolvedValue([offering('o1', 'pasargad'), offering('o2', 'saman')])
    rateTableFindMany.mockResolvedValue([
      { offeringId: 'o1', version: 1, data: table('PLACEHOLDER') },
      { offeringId: 'o2', version: 1, data: table('PLACEHOLDER') },
    ])
  })

  describe('refreshTeaserPrices', () => {
    const withTeaser = (baskets: unknown[]): RatingStrategy => ({
      ...strategy,
      teaserInputs: () => baskets,
    })

    beforeEach(() => {
      productFindMany.mockResolvedValue([
        { id: 'p1', slug: 'travel', type: 'TRAVEL', isActive: true },
      ])
      productUpdate.mockResolvedValue({})
    })

    // The «نمونه» flag has to follow the offer that actually set the headline, not any offer.
    it('marks the teaser as a sample when the winning offer used placeholder rates', async () => {
      rateTableFindMany.mockResolvedValue([
        { offeringId: 'o1', version: 1, data: { meta: { source: 'REAL_2026' }, base: 5_000_000 } },
        { offeringId: 'o2', version: 1, data: { meta: { source: 'PLACEHOLDER' }, base: 3_000_000 } },
      ])
      const service = await build([withTeaser([{ a: 1 }])])
      await expect(service.refreshTeaserPrices(NOW)).resolves.toEqual([
        { slug: 'travel', fromAmount: 3_000_000, isSample: true },
      ])
    })

    it('stores the cheapest price found across every basket and insurer', async () => {
      rateTableFindMany.mockResolvedValue([
        { offeringId: 'o1', version: 1, data: { meta: {}, base: 5_000_000 } },
        { offeringId: 'o2', version: 1, data: { meta: {}, base: 3_000_000 } },
      ])
      const service = await build([withTeaser([{ a: 1 }, { a: 2 }])])

      const summary = await service.refreshTeaserPrices(NOW)

      expect(summary).toEqual([{ slug: 'travel', fromAmount: 3_000_000, isSample: false }])
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { fromAmount: 3_000_000, fromAmountIsSample: false },
      })
    })

    // Better no headline price than a wrong one.
    it('writes null when no strategy can price the product', async () => {
      const service = await build([])
      await expect(service.refreshTeaserPrices(NOW)).resolves.toEqual([
        { slug: 'travel', fromAmount: null, isSample: false },
      ])
      expect(productUpdate).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { fromAmount: null, fromAmountIsSample: false },
      })
    })

    it('writes null when the strategy offers no teaser baskets', async () => {
      const service = await build([strategy])
      await expect(service.refreshTeaserPrices(NOW)).resolves.toEqual([
        { slug: 'travel', fromAmount: null, isSample: false },
      ])
    })

    it('writes null when every basket fails to price', async () => {
      rateTableFindMany.mockResolvedValue([])
      const service = await build([withTeaser([{ a: 1 }])])
      await expect(service.refreshTeaserPrices(NOW)).resolves.toEqual([
        { slug: 'travel', fromAmount: null, isSample: false },
      ])
    })

    it('ignores ineligible offers when picking the cheapest', async () => {
      const refusing: RatingStrategy = {
        ...withTeaser([{ a: 1 }]),
        rate: (_i, t: unknown) => {
          const base = (t as { base: number }).base
          return base < 4_000_000
            ? { eligible: false, netPremium: 0, lineItems: [], totalAmount: 0, coverages: [], explain: [] }
            : new PremiumBuilder().premium('base', 'پایه', base).toResult([])
        },
      }
      rateTableFindMany.mockResolvedValue([
        { offeringId: 'o1', version: 1, data: { meta: {}, base: 5_000_000 } },
        { offeringId: 'o2', version: 1, data: { meta: {}, base: 3_000_000 } },
      ])

      const service = await build([refusing])
      // 3,000,000 is cheaper but refused, so the teaser must be the 5,000,000 one.
      await expect(service.refreshTeaserPrices(NOW)).resolves.toEqual([
        { slug: 'travel', fromAmount: 5_000_000, isSample: false },
      ])
    })
  })

  it('prices every active offering and flags placeholder rates', async () => {
    const service = await build()
    const rated = await service.rateProduct('travel', {}, NOW)

    expect(rated.offers).toHaveLength(2)
    expect(rated.isSampleRates).toBe(true)
    expect(rated.offers[0]?.result.totalAmount).toBe(1_000_000)
    expect(rated.offers[0]?.rateTableVersion).toBe(1)
  })

  it('does not flag sample rates once tables carry a real source', async () => {
    rateTableFindMany.mockResolvedValue([
      { offeringId: 'o1', version: 1, data: table('PASARGAD_2026_Q3') },
      { offeringId: 'o2', version: 1, data: table('SAMAN_2026_Q3') },
    ])
    const rated = await (await build()).rateProduct('travel', {}, NOW)
    expect(rated.isSampleRates).toBe(false)
  })

  // One bad date should not read as "every insurer refused you".
  it('parses the input once, before any insurer is rated', async () => {
    const service = await build()
    await expect(service.rateProduct('travel', { bad: true }, NOW)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    })
    expect(strategy.parse).toHaveBeenCalledTimes(1)
    expect(strategy.rate).not.toHaveBeenCalled()
  })

  it('uses the highest version in force for each offering', async () => {
    rateTableFindMany.mockResolvedValue([
      { offeringId: 'o1', version: 1, data: { meta: {}, base: 1_000_000 } },
      { offeringId: 'o1', version: 2, data: { meta: {}, base: 2_000_000 } },
      { offeringId: 'o2', version: 1, data: { meta: {}, base: 3_000_000 } },
    ])
    const rated = await (await build()).rateProduct('travel', {}, NOW)

    expect(rated.offers[0]?.rateTableVersion).toBe(2)
    expect(rated.offers[0]?.result.totalAmount).toBe(2_000_000)
    expect(rated.offers[1]?.result.totalAmount).toBe(3_000_000)
  })

  it('asks only for tables in force at the given instant', async () => {
    await (await build()).rateProduct('travel', {}, NOW)
    expect(rateTableFindMany.mock.calls[0][0].where).toEqual({
      offeringId: { in: ['o1', 'o2'] },
      effectiveFrom: { lte: NOW },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: NOW } }],
    })
  })

  // A half-configured insurer must not take down the whole comparison.
  it('skips an insurer with no published rates and still quotes the rest', async () => {
    rateTableFindMany.mockResolvedValue([{ offeringId: 'o2', version: 1, data: table('X') }])
    const rated = await (await build()).rateProduct('travel', {}, NOW)

    expect(rated.offers).toHaveLength(1)
    expect(rated.offers[0]?.offering.insurer.slug).toBe('saman')
  })

  it('reports NO_ELIGIBLE_OFFERS when nothing can be priced', async () => {
    rateTableFindMany.mockResolvedValue([])
    await expect((await build()).rateProduct('travel', {}, NOW)).rejects.toMatchObject({
      code: 'NO_ELIGIBLE_OFFERS',
    })
  })

  it('reports NOT_FOUND for an unknown or inactive product', async () => {
    productFindFirst.mockResolvedValue(null)
    await expect((await build()).rateProduct('nope', {}, NOW)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  // A missing strategy is a configuration problem, not a crash.
  it('reports PRODUCT_UNAVAILABLE when no strategy is registered', async () => {
    const service = await build([])
    await expect(service.rateProduct('travel', {}, NOW)).rejects.toMatchObject({
      code: 'PRODUCT_UNAVAILABLE',
    })
  })
})

describe('RatingRegistry', () => {
  const make = (productType: string): RatingStrategy =>
    ({
      productType,
      parse: (i: unknown) => i,
      rate: () => ({}),
      coveragePeriod: () => ({ startsAt: new Date(), endsAt: new Date() }),
    }) as unknown as RatingStrategy

  it('refuses two strategies for the same product', () => {
    expect(() => new RatingRegistry([make('TRAVEL'), make('TRAVEL')])).toThrow(
      'Duplicate rating strategy for TRAVEL',
    )
  })

  it('reports which product types it can price', () => {
    const registry = new RatingRegistry([make('TRAVEL'), make('MOTOR_TPL')])
    expect(registry.supportedTypes).toEqual(['TRAVEL', 'MOTOR_TPL'])
    expect(registry.has('HOME_FIRE')).toBe(false)
  })
})
