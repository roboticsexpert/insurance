import { Test } from '@nestjs/testing'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { RatingService } from '../rating/rating.service'
import { QuotesService } from './quotes.service'

const NOW = new Date('2026-08-20T10:00:00Z')

const insurer = (slug: string, claimSatisfaction: number) => ({
  id: `i-${slug}`,
  slug,
  name: slug,
  logoUrl: null,
  solvencyLevel: 1,
  claimSatisfaction,
  branchCount: 10,
})

const storedOffer = (
  slug: string,
  totalAmount: number,
  claimSatisfaction: number,
  over: Record<string, unknown> = {},
) => ({
  id: `off-${slug}`,
  insurer: insurer(slug, claimSatisfaction),
  offering: { featuresFa: [] },
  netPremium: totalAmount,
  totalAmount,
  lineItems: [],
  coverages: [],
  isEligible: true,
  ineligibleReasonFa: null,
  rateTableVersion: 1,
  ...over,
})

const quoteRow = (offers: unknown[], over: Record<string, unknown> = {}) => ({
  id: 'q1',
  userId: null,
  input: { a: 1 },
  createdAt: NOW,
  expiresAt: new Date(NOW.getTime() + 30 * 60_000),
  status: 'ACTIVE',
  isSampleRates: true,
  product: { slug: 'travel', titleFa: 'بیمه مسافرتی', type: 'TRAVEL' },
  offers,
  ...over,
})

describe('QuotesService', () => {
  const quoteCreate = jest.fn()
  const quoteFindUnique = jest.fn()
  const quoteUpdate = jest.fn()
  const rateProduct = jest.fn()
  let service: QuotesService

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: PrismaService,
          useValue: {
            quote: { create: quoteCreate, findUnique: quoteFindUnique, update: quoteUpdate },
          },
        },
        { provide: RatingService, useValue: { rateProduct } },
      ],
    }).compile()
    service = moduleRef.get(QuotesService)
  })

  describe('create', () => {
    beforeEach(() => {
      rateProduct.mockResolvedValue({
        product: { id: 'p1', slug: 'travel' },
        isSampleRates: true,
        offers: [
          {
            offering: { id: 'o1', insurerId: 'i-a' },
            rateTableVersion: 3,
            result: {
              eligible: true,
              netPremium: 1_000_000,
              totalAmount: 1_120_000,
              lineItems: [{ key: 'base', labelFa: 'پایه', amount: 1_000_000, kind: 'PREMIUM' }],
              coverages: [{ key: 'medical', labelFa: 'درمان', valueFa: 'دارد' }],
              explain: ['مقصد: شنگن'],
            },
          },
        ],
      })
      quoteCreate.mockResolvedValue(quoteRow([storedOffer('a', 1_120_000, 80)]))
    })

    /*
     * The freeze: premium, line items, coverages and the engine's trace are all written down.
     * An order later reads this row, so a rate change mid-checkout cannot move the price.
     */
    it('stores the priced offers, including the explain trace', async () => {
      await service.create('travel', { a: 1 }, null, NOW)

      const created = quoteCreate.mock.calls[0][0].data
      const offer = created.offers.create[0]
      expect(offer).toMatchObject({
        offeringId: 'o1',
        netPremium: 1_000_000,
        totalAmount: 1_120_000,
        isEligible: true,
        rateTableVersion: 3,
      })
      expect(offer.breakdown).toEqual(['مقصد: شنگن'])
      expect(offer.coverages).toEqual([{ key: 'medical', labelFa: 'درمان', valueFa: 'دارد' }])
    })

    it('sets a 30-minute expiry from the quoting instant', async () => {
      await service.create('travel', { a: 1 }, null, NOW)
      expect(quoteCreate.mock.calls[0][0].data.expiresAt).toEqual(
        new Date(NOW.getTime() + 30 * 60_000),
      )
    })

    it('records the quote as anonymous when nobody is signed in', async () => {
      await service.create('travel', { a: 1 }, null, NOW)
      expect(quoteCreate.mock.calls[0][0].data.userId).toBeNull()
    })

    // Frozen with the quote: the tables can be replaced after the customer saw the price.
    it('freezes whether the prices came from placeholder tables', async () => {
      await service.create('travel', { a: 1 }, null, NOW)
      expect(quoteCreate.mock.calls[0][0].data.isSampleRates).toBe(true)
    })
  })

  describe('findById', () => {
    it('never re-rates — it reads the stored prices', async () => {
      quoteFindUnique.mockResolvedValue(quoteRow([storedOffer('a', 1_120_000, 80)]))
      const dto = await service.findById('q1', null, NOW)

      expect(rateProduct).not.toHaveBeenCalled()
      expect(dto.offers[0]?.totalAmount).toBe(1_120_000)
    })

    it('reports expiry against the given instant', async () => {
      quoteFindUnique.mockResolvedValue(quoteRow([storedOffer('a', 1_000_000, 80)]))
      const later = new Date(NOW.getTime() + 31 * 60_000)

      await expect(service.findById('q1', null, NOW)).resolves.toMatchObject({ isExpired: false })
      await expect(service.findById('q1', null, later)).resolves.toMatchObject({ isExpired: true })
    })

    // The UI needs to render "expired, quote again" — a hard error would give it nothing to show.
    it('still returns an expired quote rather than erroring', async () => {
      quoteFindUnique.mockResolvedValue(quoteRow([storedOffer('a', 1_000_000, 80)]))
      const dto = await service.findById('q1', null, new Date(NOW.getTime() + 60 * 60_000))
      expect(dto.offers).toHaveLength(1)
    })

    it('rejects reading someone else’s quote', async () => {
      quoteFindUnique.mockResolvedValue(quoteRow([storedOffer('a', 1_000_000, 80)], { userId: 'u2' }))
      const error = await service.findById('q1', 'u1', NOW).catch((e: AppException) => e)
      expect((error as AppException).code).toBe('QUOTE_NOT_YOURS')
    })

    // This is what makes "quote before login" survive the login at checkout.
    it('claims an anonymous quote for the first signed-in caller', async () => {
      quoteFindUnique.mockResolvedValue(quoteRow([storedOffer('a', 1_000_000, 80)]))
      await service.findById('q1', 'u1', NOW)
      expect(quoteUpdate).toHaveBeenCalledWith({ where: { id: 'q1' }, data: { userId: 'u1' } })
    })

    it('does not touch a quote that is already owned by the caller', async () => {
      quoteFindUnique.mockResolvedValue(quoteRow([storedOffer('a', 1_000_000, 80)], { userId: 'u1' }))
      await service.findById('q1', 'u1', NOW)
      expect(quoteUpdate).not.toHaveBeenCalled()
    })

    it('reports NOT_FOUND for an unknown id', async () => {
      quoteFindUnique.mockResolvedValue(null)
      await expect(service.findById('nope', null, NOW)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('sorting and badges', () => {
    const load = async (offers: unknown[]) => {
      quoteFindUnique.mockResolvedValue(quoteRow(offers))
      return service.findById('q1', null, NOW)
    }

    it('orders cheapest first and badges it', async () => {
      const dto = await load([
        storedOffer('expensive', 3_000_000, 90),
        storedOffer('cheap', 1_000_000, 60),
        storedOffer('middle', 2_000_000, 70),
      ])

      expect(dto.offers.map((o) => o.insurer.slug)).toEqual(['cheap', 'middle', 'expensive'])
      expect(dto.offers[0]?.badges).toContain('CHEAPEST')
    })

    /*
     * A refused insurer stays visible: "this company will not cover an 82-year-old" is useful,
     * and hiding it makes the comparison look incomplete.
     */
    it('keeps refusals in the list, at the end, unbadged', async () => {
      const dto = await load([
        storedOffer('refused', 0, 95, {
          isEligible: false,
          ineligibleReasonFa: 'سن بالای حد مجاز',
        }),
        storedOffer('ok', 1_000_000, 60),
      ])

      expect(dto.offers.map((o) => o.insurer.slug)).toEqual(['ok', 'refused'])
      expect(dto.offers[1]?.ineligibleReasonFa).toBe('سن بالای حد مجاز')
      expect(dto.offers[1]?.badges).toEqual([])
    })

    it('recommends the best claims record among the near-cheapest', async () => {
      const dto = await load([
        storedOffer('cheap', 1_000_000, 60),
        storedOffer('slightly-more', 1_150_000, 95), // within 20%
        storedOffer('great-but-pricey', 5_000_000, 99), // outside 20%
      ])

      const recommended = dto.offers.find((o) => o.badges.includes('RECOMMENDED'))
      expect(recommended?.insurer.slug).toBe('slightly-more')
    })

    it('lets one offer be both cheapest and recommended', async () => {
      const dto = await load([
        storedOffer('cheap', 1_000_000, 95),
        storedOffer('other', 1_100_000, 60),
      ])
      expect(dto.offers[0]?.badges).toEqual(['CHEAPEST', 'RECOMMENDED'])
    })

    it('badges nothing when every insurer refused', async () => {
      const dto = await load([
        storedOffer('a', 0, 90, { isEligible: false, ineligibleReasonFa: 'رد' }),
        storedOffer('b', 0, 80, { isEligible: false, ineligibleReasonFa: 'رد' }),
      ])
      expect(dto.offers.every((o) => o.badges.length === 0)).toBe(true)
    })
  })
})
