import { Test } from '@nestjs/testing'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { CatalogService } from './catalog.service'

const insurer = (over = {}) => ({
  id: 'i1',
  slug: 'pasargad',
  name: 'بیمه پاسارگاد',
  logoUrl: null,
  solvencyLevel: 1,
  claimSatisfaction: 88,
  branchCount: 320,
  isActive: true,
  sortWeight: 0,
  ...over,
})

const product = (over = {}) => ({
  id: 'p1',
  slug: 'travel',
  type: 'TRAVEL',
  titleFa: 'بیمه مسافرتی',
  subtitleFa: 'برای سفر خارجی',
  descriptionFa: 'توضیح',
  highlightsFa: ['۲۴ ساعته'],
  faq: [{ q: 'س', a: 'ج' }],
  iconKey: 'plane',
  fulfillment: 'INSTANT',
  isActive: true,
  sortWeight: 0,
  fromAmount: 4_500_000,
  ...over,
})

describe('CatalogService', () => {
  const productFindMany = jest.fn()
  const productFindFirst = jest.fn()
  const insurerFindMany = jest.fn()
  let service: CatalogService

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: PrismaService,
          useValue: {
            product: { findMany: productFindMany, findFirst: productFindFirst },
            insurer: { findMany: insurerFindMany },
          },
        },
      ],
    }).compile()
    service = moduleRef.get(CatalogService)
  })

  describe('listProducts', () => {
    it('returns cards ordered by weight, and asks only for active products', async () => {
      productFindMany.mockResolvedValue([product()])
      const result = await service.listProducts()

      expect(productFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ sortWeight: 'asc' }, { titleFa: 'asc' }],
      })
      expect(result[0]).toEqual({
        id: 'p1',
        slug: 'travel',
        type: 'TRAVEL',
        titleFa: 'بیمه مسافرتی',
        subtitleFa: 'برای سفر خارجی',
        iconKey: 'plane',
        fulfillment: 'INSTANT',
        fromAmount: 4_500_000,
      })
    })

    // The card is a card: no description, no FAQ, no insurer list on the home screen.
    it('does not leak detail fields into the card', async () => {
      productFindMany.mockResolvedValue([product()])
      const [card] = await service.listProducts()
      expect(card).not.toHaveProperty('descriptionFa')
      expect(card).not.toHaveProperty('faq')
    })

    it('passes a null fromAmount through rather than inventing a price', async () => {
      productFindMany.mockResolvedValue([product({ fromAmount: null })])
      const [card] = await service.listProducts()
      expect(card?.fromAmount).toBeNull()
    })
  })

  describe('getProduct', () => {
    it('includes only insurers with an active offering', async () => {
      productFindFirst.mockResolvedValue({
        ...product(),
        offerings: [{ insurer: insurer() }],
      })

      const result = await service.getProduct('travel')
      expect(result.insurers).toHaveLength(1)
      expect(result.insurers[0]?.name).toBe('بیمه پاسارگاد')
      expect(result.faq).toEqual([{ q: 'س', a: 'ج' }])

      const where = productFindFirst.mock.calls[0][0]
      expect(where.where).toEqual({ slug: 'travel', isActive: true })
      expect(where.include.offerings.where).toEqual({
        isActive: true,
        insurer: { isActive: true },
      })
    })

    // An inactive product must look missing, not merely unavailable.
    it('throws NOT_FOUND for an unknown or inactive slug', async () => {
      productFindFirst.mockResolvedValue(null)
      const error = await service.getProduct('nope').catch((e: AppException) => e)
      expect(error).toBeInstanceOf(AppException)
      expect((error as AppException).code).toBe('NOT_FOUND')
    })

    it.each([
      ['not an array', 'oops'],
      ['null', null],
      ['array of junk', [{ q: 1 }, 'x', null]],
    ])('survives a malformed faq column (%s)', async (_label, faq) => {
      productFindFirst.mockResolvedValue({ ...product({ faq }), offerings: [] })
      await expect(service.getProduct('travel')).resolves.toMatchObject({ faq: [] })
    })
  })

  it('lists only active insurers', async () => {
    insurerFindMany.mockResolvedValue([insurer()])
    const result = await service.listInsurers()

    expect(insurerFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortWeight: 'asc' }, { name: 'asc' }],
    })
    expect(result[0]?.slug).toBe('pasargad')
  })
})
