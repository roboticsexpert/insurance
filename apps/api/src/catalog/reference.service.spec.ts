import { Test } from '@nestjs/testing'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { REFERENCE_KEYS, isReferenceKey } from './reference.dto'
import { ReferenceService } from './reference.service'

describe('ReferenceService', () => {
  const cityFindMany = jest.fn()
  const vehicleFindMany = jest.fn()
  let service: ReferenceService

  beforeEach(async () => {
    jest.clearAllMocks()
    cityFindMany.mockResolvedValue([])
    vehicleFindMany.mockResolvedValue([])
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReferenceService,
        {
          provide: PrismaService,
          useValue: { city: { findMany: cityFindMany }, vehicleModel: { findMany: vehicleFindMany } },
        },
      ],
    }).compile()
    service = moduleRef.get(ReferenceService)
  })

  it('answers every advertised key without throwing', async () => {
    for (const key of REFERENCE_KEYS) {
      await expect(service.list(key)).resolves.toBeInstanceOf(Array)
    }
  })

  it('rejects an unknown key', () => {
    expect(isReferenceKey('nope')).toBe(false)
  })

  describe('enum-backed lists', () => {
    it('returns travel zones with Persian labels', async () => {
      const zones = await service.list('travel-zones')
      expect(zones).toContainEqual({ value: 'SCHENGEN', labelFa: 'اروپا (شنگن)' })
      expect(zones).toHaveLength(5)
    })

    it('labels property tiers with a Persian decimal separator, not a dot', async () => {
      const tiers = await service.list('property-tiers')
      expect(tiers).toContainEqual({
        value: 'P_2_5',
        labelFa: '۲٫۵ درصد تعهد جانی',
        meta: { percent: 2.5 },
      })
      // A Latin dot anywhere here would be a bug the user can see.
      expect(tiers.every((t) => !t.labelFa.includes('.'))).toBe(true)
    })

    it('returns plate letters usable directly as options', async () => {
      const letters = await service.list('plate-letters')
      expect(letters).toContainEqual({ value: 'ب', labelFa: 'ب' })
    })
  })

  describe('cities', () => {
    beforeEach(() => {
      cityFindMany.mockResolvedValue([
        { id: 'c1', nameFa: 'تهران', provinceFa: 'تهران', quakeZone: 1 },
      ])
    })

    it('groups by province and carries the quake zone the rating needs', async () => {
      const cities = await service.list('cities')
      expect(cities[0]).toEqual({
        value: 'c1',
        labelFa: 'تهران',
        groupFa: 'تهران',
        meta: { quakeZone: 1 },
      })
    })

    // Arabic keyboards emit ي and ك; the stored data uses ی and ک.
    it('normalises the search term so an Arabic-keyboard query still matches', async () => {
      await service.list('cities', 'كرمان')
      expect(cityFindMany.mock.calls[0][0].where).toEqual({ nameFa: { contains: 'کرمان' } })
    })

    it('omits the filter entirely when no query is given', async () => {
      await service.list('cities')
      expect(cityFindMany.mock.calls[0][0].where).toBeUndefined()
    })

    it('caps the result set', async () => {
      await service.list('cities')
      expect(cityFindMany.mock.calls[0][0].take).toBe(500)
    })
  })

  describe('vehicle models', () => {
    it('labels as brand + model and carries the group', async () => {
      vehicleFindMany.mockResolvedValue([
        { id: 'v1', brandFa: 'ایران خودرو', modelFa: 'پژو ۲۰۶', group: 'SEDAN', isActive: true },
      ])
      const models = await service.list('vehicle-models')
      expect(models[0]).toEqual({
        value: 'v1',
        labelFa: 'ایران خودرو پژو ۲۰۶',
        groupFa: 'ایران خودرو',
        meta: { group: 'SEDAN' },
      })
    })

    it('searches brand and model, and never returns inactive rows', async () => {
      await service.list('vehicle-models', 'پژو')
      expect(vehicleFindMany.mock.calls[0][0].where).toEqual({
        isActive: true,
        OR: [{ brandFa: { contains: 'پژو' } }, { modelFa: { contains: 'پژو' } }],
      })
    })
  })

  it('throws NOT_FOUND if an unlisted key reaches the service', async () => {
    const error = await service.list('bogus' as never).catch((e: AppException) => e)
    expect((error as AppException).code).toBe('NOT_FOUND')
  })
})

describe('Persian collation', () => {
  const cityFindMany = jest.fn()
  const vehicleFindMany = jest.fn()
  let service: ReferenceService

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReferenceService,
        {
          provide: PrismaService,
          useValue: {
            city: { findMany: cityFindMany },
            vehicleModel: { findMany: vehicleFindMany },
          },
        },
      ],
    }).compile()
    service = moduleRef.get(ReferenceService)
  })

  /*
   * پ is U+067E and س is U+0633, so code-point order puts سمند first — but the Persian
   * alphabet puts پ long before س. A list ordered by the database collation reads as
   * scrambled to a Persian speaker.
   */
  it('orders پ before س, which code-point order gets backwards', async () => {
    vehicleFindMany.mockResolvedValue([
      { id: 'v2', brandFa: 'ایران خودرو', modelFa: 'سمند', group: 'SEDAN' },
      { id: 'v1', brandFa: 'ایران خودرو', modelFa: 'پژو ۲۰۶', group: 'SEDAN' },
    ])
    const models = await service.list('vehicle-models')
    expect(models.map((m) => m.labelFa)).toEqual([
      'ایران خودرو پژو ۲۰۶',
      'ایران خودرو سمند',
    ])
  })

  it('groups cities by province in Persian order', async () => {
    cityFindMany.mockResolvedValue([
      { id: 'c3', nameFa: 'کرمان', provinceFa: 'کرمان', quakeZone: 2 },
      { id: 'c1', nameFa: 'تهران', provinceFa: 'تهران', quakeZone: 1 },
      { id: 'c4', nameFa: 'شیراز', provinceFa: 'فارس', quakeZone: 2 },
    ])
    const cities = await service.list('cities')
    // Persian alphabet: ت … ف … ک — so تهران, then فارس, then کرمان.
    expect(cities.map((c) => c.groupFa)).toEqual(['تهران', 'فارس', 'کرمان'])
  })
})
