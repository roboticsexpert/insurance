import { AppException } from '../../common/app.exception'
import { LineItemKind } from '../../products/labels'
import type { HomeFireInput } from '../../products/schemas/home-fire'
import type { RatingLookups } from '../rating-strategy'
import type { HomeFireRateTable } from './home-fire.rate-table'
import { HomeFireRatingStrategy, type PreparedHomeFireInput } from './home-fire.strategy'

const NOW = new Date('2026-08-20T09:00:00Z')
const ctx = { now: NOW }

/**
 * Round numbers so every expected premium can be checked by hand. Building 1‰, contents 2‰,
 * so a 10bn/1bn split is exactly 10,000,000 + 2,000,000.
 */
const table: HomeFireRateTable = {
  meta: { source: 'FIXTURE' },
  baseRates: {
    APARTMENT: { building: 0.001, contents: 0.002 },
    VILLA: { building: 0.002, contents: 0.004 },
  },
  perilRates: {
    EARTHQUAKE: {
      basis: 'BOTH',
      rate: 0.001,
      zoneFactors: { '1': 2, '2': 1.5, '3': 1, '4': 0.5 },
    },
    THEFT: { basis: 'CONTENTS', rate: 0.004 },
    FLOOD: { basis: 'BOTH', rate: 0.0005 },
  },
  minPremium: 1_000_000,
  taxRate: 0.1,
  fees: [{ key: 'stamp', labelFa: 'حق تمبر', amount: 20_000 }],
  coverages: [{ key: 'debris', labelFa: 'هزینه پاک‌سازی آوار', valueFa: 'تا ۵٪ سرمایه' }],
  limits: { maxSumInsured: 100_000_000_000, maxAreaSqm: 2000 },
}

const baseInput: PreparedHomeFireInput = {
  propertyType: 'APARTMENT',
  cityId: 'c1',
  areaSqm: 90,
  buildingValue: 10_000_000_000,
  contentsValue: 1_000_000_000,
  extraPerils: [],
  durationMonths: 12,
  startDate: '2026-09-01',
  quakeZone: 3,
}

const input = (over: Partial<PreparedHomeFireInput> = {}): PreparedHomeFireInput => ({
  ...baseInput,
  ...over,
})

const strategy = new HomeFireRatingStrategy()
const rate = (over: Partial<PreparedHomeFireInput> = {}) => strategy.rate(input(over), table)
const lineFor = (result: ReturnType<typeof rate>, key: string) =>
  result.lineItems.find((item) => item.key === key)

const lookups = (over: Partial<RatingLookups> = {}): RatingLookups => ({
  cityQuakeZone: jest.fn().mockResolvedValue(2),
  cityQuakeZones: jest.fn().mockResolvedValue([
    { id: 'tehran', quakeZone: 1 },
    { id: 'mashhad', quakeZone: 2 },
    { id: 'yazd', quakeZone: 3 },
    { id: 'other', quakeZone: 2 },
  ]),
  ...over,
})

describe('HomeFireRatingStrategy.rate', () => {
  describe('the base premium', () => {
    it('rates each half of the sum insured at its own rate', () => {
      const result = rate()

      expect(lineFor(result, 'building')?.amount).toBe(10_000_000)
      expect(lineFor(result, 'contents')?.amount).toBe(2_000_000)
      expect(result.netPremium).toBe(12_000_000)
    })

    it('charges a villa more than the same flat', () => {
      const flat = rate()
      const villa = rate({ propertyType: 'VILLA' })
      expect(villa.netPremium).toBe(flat.netPremium * 2)
    })

    it('omits a line for a sum the customer did not insure', () => {
      const result = rate({ contentsValue: 0 })
      expect(lineFor(result, 'contents')).toBeUndefined()
      expect(lineFor(result, 'building')?.amount).toBe(10_000_000)
    })

    it('does not rate on floor area — the sum insured is the driver', () => {
      expect(rate({ areaSqm: 40 }).totalAmount).toBe(rate({ areaSqm: 400 }).totalAmount)
    })
  })

  describe('extra perils', () => {
    it('loads earthquake by the city seismic zone', () => {
      const zone3 = rate({ extraPerils: ['EARTHQUAKE'] })
      const zone1 = rate({ extraPerils: ['EARTHQUAKE'], quakeZone: 1 })

      // 11bn × 0.001 × 1 (zone 3) vs × 2 (zone 1)
      expect(lineFor(zone3, 'peril:EARTHQUAKE')?.amount).toBe(11_000_000)
      expect(lineFor(zone1, 'peril:EARTHQUAKE')?.amount).toBe(22_000_000)
    })

    it('falls back to a factor of one for a zone the table does not list', () => {
      const result = rate({ extraPerils: ['EARTHQUAKE'], quakeZone: 9 })
      expect(lineFor(result, 'peril:EARTHQUAKE')?.amount).toBe(11_000_000)
    })

    it('attaches theft to contents only — thieves take belongings, not walls', () => {
      const result = rate({ extraPerils: ['THEFT'] })
      // 1bn contents × 0.004, not 11bn.
      expect(lineFor(result, 'peril:THEFT')?.amount).toBe(4_000_000)
    })

    it('skips a peril whose basis the customer insured for nothing', () => {
      const result = rate({ contentsValue: 0, extraPerils: ['THEFT'] })
      expect(lineFor(result, 'peril:THEFT')).toBeUndefined()
      expect(result.eligible).toBe(true)
    })

    it('adds every chosen peril as its own line', () => {
      const result = rate({ extraPerils: ['EARTHQUAKE', 'THEFT', 'FLOOD'] })
      const keys = result.lineItems.map((i) => i.key)

      expect(keys).toContain('peril:EARTHQUAKE')
      expect(keys).toContain('peril:THEFT')
      expect(keys).toContain('peril:FLOOD')
    })

    it('refuses when the insurer does not sell a peril that was asked for', () => {
      const result = rate({ extraPerils: ['WATER_DAMAGE'] })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('ترکیدگی')
    })
  })

  describe('the premium floor', () => {
    it('tops up to the minimum with a visible line, not a silent replacement', () => {
      // 100m building at 1‰ = 100,000 — well under the 1,000,000 floor.
      const result = rate({ buildingValue: 100_000_000, contentsValue: 0 })

      expect(lineFor(result, 'minimum')?.amount).toBe(900_000)
      expect(lineFor(result, 'minimum')?.kind).toBe(LineItemKind.PREMIUM)
      expect(result.netPremium).toBe(1_000_000)
    })

    it('leaves a premium above the floor alone', () => {
      expect(lineFor(rate(), 'minimum')).toBeUndefined()
    })
  })

  describe('tax, fees and totals', () => {
    it('taxes the net premium and keeps fees off the tax base', () => {
      const result = rate()
      expect(lineFor(result, 'tax')?.amount).toBe(1_200_000)
      expect(lineFor(result, 'stamp')?.amount).toBe(20_000)
      expect(result.totalAmount).toBe(12_000_000 + 20_000 + 1_200_000)
    })

    it('totals to the sum of every line, in whole Rial', () => {
      for (const over of [
        {},
        { propertyType: 'VILLA' as const },
        { extraPerils: ['EARTHQUAKE', 'THEFT'] as HomeFireInput['extraPerils'] },
        { buildingValue: 100_000_000, contentsValue: 0 },
      ]) {
        const result = rate(over)
        const sum = result.lineItems.reduce((acc, i) => acc + i.amount, 0)

        expect(result.totalAmount).toBe(sum)
        for (const item of result.lineItems) expect(Number.isInteger(item.amount)).toBe(true)
      }
    })
  })

  describe('refusals', () => {
    it('refuses a sum insured above what the insurer writes', () => {
      const result = rate({ buildingValue: 200_000_000_000 })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('حداکثر سرمایه')
    })

    it('refuses a property type the table does not price', () => {
      const narrow = { ...table, baseRates: { APARTMENT: table.baseRates.APARTMENT! } }
      const result = strategy.rate(input({ propertyType: 'VILLA' }), narrow)
      expect(result.eligible).toBe(false)
    })

    it('drops one insurer rather than throwing when its table is malformed', () => {
      const result = strategy.rate(input(), { meta: { source: 'BROKEN' } })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('در دسترس نیست')
    })
  })

  describe('coverages', () => {
    it('leads with the sums insured and names the included perils', () => {
      const result = rate({ extraPerils: ['THEFT'] })

      expect(result.coverages[0]).toMatchObject({ key: 'building', highlight: true })
      expect(result.coverages[1]).toMatchObject({ key: 'contents', highlight: true })
      expect(result.coverages[2]?.valueFa).toContain('صاعقه')
      expect(result.coverages.map((c) => c.key)).toContain('peril:THEFT')
    })

    it('writes the trace in Persian, with no Latin digits', () => {
      const trace = rate({ extraPerils: ['EARTHQUAKE'] }).explain.join('\n')
      expect(trace).toContain('پهنه لرزه‌ای')
      expect(trace).not.toMatch(/[0-9]/)
    })
  })
})

describe('HomeFireRatingStrategy.prepare', () => {
  it('resolves the seismic zone from the city id', async () => {
    const port = lookups()
    const prepared = await strategy.prepare(baseInput, port)

    expect(prepared.quakeZone).toBe(2)
    expect(port.cityQuakeZone).toHaveBeenCalledWith('c1')
  })

  it('rejects an unknown city as a bad request, not five refusals', async () => {
    const port = lookups({ cityQuakeZone: jest.fn().mockResolvedValue(null) })
    await expect(strategy.prepare(baseInput, port)).rejects.toThrow(AppException)
  })
})

describe('HomeFireRatingStrategy.parse', () => {
  it('rejects a policy backdated before today', () => {
    expect(() => strategy.parse(input({ startDate: '2026-08-19' }), ctx)).toThrow(AppException)
  })

  it('rejects a home insured for nothing at all', () => {
    expect(() =>
      strategy.parse(input({ buildingValue: 0, contentsValue: 0 }), ctx),
    ).toThrow(AppException)
  })
})

describe('HomeFireRatingStrategy.teaserInputs', () => {
  it('offers one buyable basket per seismic zone the seed contains', async () => {
    const baskets = (await strategy.teaserInputs(ctx, lookups())) as HomeFireInput[]

    // Four cities, three distinct zones — one basket each, not one per city.
    expect(baskets).toHaveLength(3)
    expect(new Set(baskets.map((b) => b.cityId)).size).toBe(3)

    for (const basket of baskets) {
      expect(() => strategy.parse(basket, ctx)).not.toThrow()
      expect(basket.extraPerils).toEqual([])
    }
  })
})

describe('HomeFireRatingStrategy.coveragePeriod', () => {
  it('runs for a year, ending the day before it recurs', () => {
    const { startsAt, endsAt } = strategy.coveragePeriod(input({ startDate: '2026-09-01' }))
    expect(startsAt.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(endsAt.toISOString()).toBe('2027-08-31T23:59:59.000Z')
  })
})
