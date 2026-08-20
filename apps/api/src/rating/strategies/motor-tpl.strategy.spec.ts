import { AppException } from '../../common/app.exception'
import { LineItemKind } from '../../products/labels'
import type { MotorTplInput } from '../../products/schemas/motor-tpl'
import type { MotorTplRateTable } from './motor-tpl.rate-table'
import { jalaliYear, MotorTplRatingStrategy } from './motor-tpl.strategy'

/** 2026-08-20 is 1405-05-29, so the current Jalali year is 1405 throughout. */
const NOW = new Date('2026-08-20T09:00:00Z')
const ctx = { now: NOW }
const START_DATE = '2026-09-01'

/**
 * A deliberately round fixture so every expected price can be checked by hand.
 * دیه is 10,000,000,000 and the bodily rate 1%, which makes the base bodily premium exactly
 * 100,000,000 Rial for a personal sedan in the youngest age band.
 */
const table: MotorTplRateTable = {
  meta: { source: 'FIXTURE' },
  diyeAmount: 10_000_000_000,
  bodilyBaseRate: 0.01,
  propertyBaseRate: 0.04,
  groupFactors: { SEDAN: 1, TRUCK: 2, MOTORCYCLE: 0.2 },
  usageFactors: { PERSONAL: 1, TAXI: 1.5 },
  vehicleAgeBands: [
    { max: 5, factor: 1 },
    { max: 15, factor: 1.1 },
    { max: 60, factor: 1.5 },
  ],
  bodilyDiscountLadder: [0, 0.1, 0.5],
  propertyDiscountLadder: [0, 0.2],
  taxRate: 0.1,
  levies: {
    bodilyFundRate: 0.08,
    fixed: [
      { key: 'traffic', labelFa: 'عوارض راهنمایی و رانندگی', amount: 400_000 },
      { key: 'stamp', labelFa: 'حق تمبر', amount: 20_000 },
    ],
  },
  coverages: [{ key: 'driver', labelFa: 'حوادث راننده', valueFa: 'تا سقف دیه' }],
  limits: { maxVehicleAgeYears: 30 },
}

const baseInput: MotorTplInput = {
  vehicleUsage: 'PERSONAL',
  vehicleGroup: 'SEDAN',
  vehicleModelId: 'pride-131',
  productionYear: 1402,
  plate: { twoDigit: '12', letter: 'ب', threeDigit: '345', iranCode: '10' },
  startDate: START_DATE,
  hasPreviousPolicy: false,
  bodilyDiscountYears: 0,
  propertyDiscountYears: 0,
  propertyCoverageTier: 'P_2_5',
}

const input = (over: Partial<MotorTplInput> = {}): MotorTplInput => ({ ...baseInput, ...over })

const strategy = new MotorTplRatingStrategy()
const rate = (over: Partial<MotorTplInput> = {}) => strategy.rate(input(over), table)

const lineFor = (result: ReturnType<typeof rate>, key: string) =>
  result.lineItems.find((item) => item.key === key)

describe('jalaliYear', () => {
  it('reads the Jalali year, not the Gregorian one', () => {
    expect(jalaliYear(new Date('2026-08-20T00:00:00Z'))).toBe(1405)
    // 21 March is Nowruz: the day the Jalali year turns over.
    expect(jalaliYear(new Date('2026-03-20T00:00:00Z'))).toBe(1404)
    expect(jalaliYear(new Date('2026-03-21T00:00:00Z'))).toBe(1405)
  })
})

describe('MotorTplRatingStrategy.rate', () => {
  describe('the premium itself', () => {
    it('derives both premiums from دیه', () => {
      const result = rate()

      // 10,000,000,000 × 0.01 × 1 × 1 × 1
      expect(lineFor(result, 'bodily')?.amount).toBe(100_000_000)
      // property limit = 2.5% of دیه = 250,000,000; × 0.04 × 1 × 1
      expect(lineFor(result, 'property')?.amount).toBe(10_000_000)
      expect(result.netPremium).toBe(110_000_000)
    })

    it('multiplies by the vehicle group and the usage', () => {
      const result = rate({ vehicleGroup: 'TRUCK', vehicleUsage: 'TAXI' })

      // 100,000,000 × 2 (truck) × 1.5 (taxi)
      expect(lineFor(result, 'bodily')?.amount).toBe(300_000_000)
      expect(lineFor(result, 'property')?.amount).toBe(30_000_000)
    })

    it('bands on the vehicle age in Jalali years', () => {
      // 1405 − 1392 = 13 years old, which is the 1.1 band.
      const result = rate({ productionYear: 1392 })
      expect(lineFor(result, 'bodily')?.amount).toBe(110_000_000)

      // The property premium does not depend on the vehicle's age.
      expect(lineFor(result, 'property')?.amount).toBe(10_000_000)
    })

    it('scales the property premium with the chosen tier', () => {
      // P_8 = 8% of دیه = 800,000,000 limit; × 0.04
      const result = rate({ propertyCoverageTier: 'P_8' })
      expect(lineFor(result, 'property')?.amount).toBe(32_000_000)
      // The bodily side is untouched by the property tier.
      expect(lineFor(result, 'bodily')?.amount).toBe(100_000_000)
    })

    it('prices a vehicle built after the policy year as brand new rather than negative', () => {
      const result = rate({ productionYear: 1410 })
      expect(lineFor(result, 'bodily')?.amount).toBe(100_000_000)
    })
  })

  describe('the discount ladders', () => {
    it('takes each discount off its own premium, as a negative line', () => {
      const result = rate({
        hasPreviousPolicy: true,
        bodilyDiscountYears: 2,
        propertyDiscountYears: 1,
      })

      // Ladder index 2 = 50% of the bodily premium; index 1 = 20% of the property premium.
      expect(lineFor(result, 'discount:bodily')?.amount).toBe(-50_000_000)
      expect(lineFor(result, 'discount:property')?.amount).toBe(-2_000_000)
      expect(lineFor(result, 'discount:bodily')?.kind).toBe(LineItemKind.DISCOUNT)
      expect(result.netPremium).toBe(58_000_000)
    })

    it('sits on the top rung for more years than the ladder has', () => {
      const capped = rate({ hasPreviousPolicy: true, bodilyDiscountYears: 14 })
      const top = rate({ hasPreviousPolicy: true, bodilyDiscountYears: 2 })
      expect(lineFor(capped, 'discount:bodily')?.amount).toBe(
        lineFor(top, 'discount:bodily')?.amount,
      )
    })

    it('shows no discount line at all when there is nothing to discount', () => {
      const result = rate()
      expect(lineFor(result, 'discount:bodily')).toBeUndefined()
      expect(lineFor(result, 'discount:property')).toBeUndefined()
    })

    it('leaves every discount an exact percentage of the line above it', () => {
      // The premium is rounded before the discount is taken, so the invoice reconciles.
      const result = rate({ hasPreviousPolicy: true, bodilyDiscountYears: 1 })
      const bodily = lineFor(result, 'bodily')?.amount as number
      const discount = lineFor(result, 'discount:bodily')?.amount as number
      expect(Math.abs(discount)).toBe(bodily * 0.1)
    })
  })

  describe('levies and tax', () => {
    it('keeps every levy out of the premium and on its own line', () => {
      const result = rate()

      expect(lineFor(result, 'fund')?.kind).toBe(LineItemKind.FEE)
      expect(lineFor(result, 'traffic')?.amount).toBe(400_000)
      expect(lineFor(result, 'stamp')?.amount).toBe(20_000)
      expect(lineFor(result, 'tax')?.kind).toBe(LineItemKind.TAX)

      // netPremium is premium ± discount only: no levy, no tax.
      expect(result.netPremium).toBe(110_000_000)
    })

    it('charges the bodily fund on the discounted premium, not the gross', () => {
      const undiscounted = rate()
      const discounted = rate({ hasPreviousPolicy: true, bodilyDiscountYears: 2 })

      expect(lineFor(undiscounted, 'fund')?.amount).toBe(8_000_000) // 8% of 100,000,000
      expect(lineFor(discounted, 'fund')?.amount).toBe(4_000_000) // 8% of 50,000,000
    })

    it('taxes the net premium and nothing else', () => {
      const result = rate()
      // 10% of 110,000,000 — the levies are not in the tax base.
      expect(lineFor(result, 'tax')?.amount).toBe(11_000_000)
    })

    it('totals to the sum of every line', () => {
      for (const over of [
        {},
        { vehicleGroup: 'TRUCK' as const },
        { hasPreviousPolicy: true, bodilyDiscountYears: 2, propertyDiscountYears: 1 },
        { propertyCoverageTier: 'P_8' as const },
      ]) {
        const result = rate(over)
        const sum = result.lineItems.reduce((acc, item) => acc + item.amount, 0)
        expect(result.totalAmount).toBe(sum)

        const net = result.lineItems
          .filter((i) => i.kind === LineItemKind.PREMIUM || i.kind === LineItemKind.DISCOUNT)
          .reduce((acc, item) => acc + item.amount, 0)
        expect(result.netPremium).toBe(net)
      }
    })

    it('leaves every amount an integer count of Rial', () => {
      const result = rate({ vehicleGroup: 'TRUCK', hasPreviousPolicy: true, bodilyDiscountYears: 1 })
      for (const item of result.lineItems) expect(Number.isInteger(item.amount)).toBe(true)
      expect(Number.isInteger(result.totalAmount)).toBe(true)
    })
  })

  describe('refusals', () => {
    it('refuses a vehicle older than the insurer will write', () => {
      const result = rate({ productionYear: 1370 }) // 35 years old, cap is 30
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('۳۰')
      expect(result.totalAmount).toBe(0)
    })

    it('refuses a vehicle group the table does not price', () => {
      const result = rate({ vehicleGroup: 'VAN' })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('وسیله نقلیه')
    })

    it('refuses a usage the table does not price', () => {
      const result = rate({ vehicleUsage: 'COMMERCIAL' })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('کاربری')
    })

    it('drops one insurer rather than throwing when its table is malformed', () => {
      const result = strategy.rate(input(), { meta: { source: 'BROKEN' } })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toContain('در دسترس نیست')
    })
  })

  describe('coverages and the explain trace', () => {
    it('leads with the two limits the customer actually chose', () => {
      const result = rate({ propertyCoverageTier: 'P_8' })

      expect(result.coverages[0]).toMatchObject({ key: 'bodily', highlight: true })
      expect(result.coverages[1]).toMatchObject({ key: 'property', highlight: true })
      // 800,000,000 Rial = 80,000,000 Toman, in Persian digits.
      expect(result.coverages[1]?.valueFa).toBe('۸۰٬۰۰۰٬۰۰۰ تومان')
      expect(result.coverages.map((c) => c.key)).toContain('driver')
    })

    it('records every factor it applied, in Persian', () => {
      const result = rate({ hasPreviousPolicy: true, bodilyDiscountYears: 2 })
      const trace = result.explain.join('\n')

      expect(trace).toContain('سواری')
      expect(trace).toContain('شخصی')
      expect(trace).toContain('تخفیف')
      expect(trace).not.toMatch(/[0-9]/) // no Latin digits anywhere a customer can read
    })
  })
})

describe('MotorTplRatingStrategy.parse', () => {
  it('rejects a policy backdated before today', () => {
    expect(() => strategy.parse(input({ startDate: '2026-08-19' }), ctx)).toThrow(AppException)
  })

  it('accepts one starting today', () => {
    expect(strategy.parse(input({ startDate: '2026-08-20' }), ctx).startDate).toBe('2026-08-20')
  })

  it('rejects discount years claimed without a previous policy', () => {
    expect(() => strategy.parse(input({ bodilyDiscountYears: 5 }), ctx)).toThrow(AppException)
  })

  it('rejects a motorcycle in commercial use', () => {
    expect(() =>
      strategy.parse(input({ vehicleGroup: 'MOTORCYCLE', vehicleUsage: 'COMMERCIAL' }), ctx),
    ).toThrow(AppException)
  })

  it('rejects a malformed plate', () => {
    expect(() =>
      strategy.parse(input({ plate: { ...baseInput.plate, letter: 'X' } }), ctx),
    ).toThrow(AppException)
  })
})

describe('MotorTplRatingStrategy.coveragePeriod', () => {
  it('runs for a year, ending the day before it recurs', () => {
    const { startsAt, endsAt } = strategy.coveragePeriod(input({ startDate: '2026-09-01' }))
    expect(startsAt.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(endsAt.toISOString()).toBe('2027-08-31T23:59:59.000Z')
  })

  it('handles a leap day without landing on the wrong date', () => {
    const { endsAt } = strategy.coveragePeriod(input({ startDate: '2028-02-29' }))
    expect(endsAt.toISOString()).toBe('2029-02-28T23:59:59.000Z')
  })
})

describe('MotorTplRatingStrategy.teaserInputs', () => {
  it('offers one buyable basket per vehicle group', () => {
    const baskets = strategy.teaserInputs(ctx) as MotorTplInput[]

    expect(baskets).toHaveLength(5)
    expect(new Set(baskets.map((b) => b.vehicleGroup)).size).toBe(5)

    // Every basket must survive parse — a teaser priced off an invalid input is unbuyable.
    for (const basket of baskets) {
      expect(() => strategy.parse(basket, ctx)).not.toThrow()
      expect(basket.bodilyDiscountYears).toBe(0)
      expect(basket.propertyCoverageTier).toBe('P_2_5')
    }
  })
})
