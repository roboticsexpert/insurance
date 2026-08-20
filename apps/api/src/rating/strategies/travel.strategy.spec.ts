import { AppException } from '../../common/app.exception'
import type { TravelRateTable } from './travel.rate-table'
import { ageOnDeparture, TravelRatingStrategy } from './travel.strategy'

const NOW = new Date('2026-08-20T09:00:00Z')
const ctx = { now: NOW }

/** A deliberately round fixture, so expected prices can be checked by hand. */
const table: TravelRateTable = {
  meta: { source: 'FIXTURE' },
  zoneBase: { SCHENGEN: 1_000_000, ASIA: 500_000 },
  durationBands: [
    { max: 7, factor: 1 },
    { max: 15, factor: 2 },
  ],
  ageBands: [
    { max: 12, factor: 0.5 },
    { max: 65, factor: 1 },
    { max: 120, factor: 3 },
  ],
  coverageFactors: { EUR_30K: 1, EUR_50K: 2 },
  taxRate: 0.1,
  fees: [{ key: 'stamp', labelFa: 'حق تمبر', amount: 20_000 }],
  coverages: [
    { key: 'medical', labelFa: 'هزینه‌های درمانی', valueFa: 'تا سقف تعهد' },
    { key: 'baggage', labelFa: 'فقدان بار', valueFa: 'تا ۵۰۰ یورو' },
  ],
  limits: { maxAge: 80, maxDays: 15 },
}

/** Quoting knows only a date of birth — identity is collected at checkout, not here. */
const traveler = (birthDate = '1990-05-20') => ({ birthDate })

const input = (over: Record<string, unknown> = {}) => ({
  destinationZone: 'SCHENGEN',
  startDate: '2026-09-01',
  endDate: '2026-09-08', // 7 days
  coverageLimit: 'EUR_30K',
  travelers: [traveler()],
  ...over,
})

describe('ageOnDeparture', () => {
  // Travel cover rates on age at departure, not age today — a birthday between quote and
  // departure genuinely changes the price.
  it.each([
    ['1990-05-20', '2026-09-01', 36],
    ['1990-09-01', '2026-09-01', 36], // birthday exactly on departure
    ['1990-09-02', '2026-09-01', 35], // one day short
    ['2020-01-15', '2026-09-01', 6],
  ])('born %s departing %s is %i', (birth, departure, expected) => {
    expect(ageOnDeparture(birth, departure)).toBe(expected)
  })
})

describe('TravelRatingStrategy.parse', () => {
  const strategy = new TravelRatingStrategy()

  it('accepts a well-formed request', () => {
    expect(strategy.parse(input(), ctx).destinationZone).toBe('SCHENGEN')
  })

  it.each([
    ['return before departure', { endDate: '2026-08-25' }, 'endDate'],
    ['no travelers', { travelers: [] }, 'travelers'],
    ['a malformed birth date', { travelers: [{ birthDate: 'nope' }] }, 'travelers'],
  ])('reports %s as a field error', (_label, patch, field) => {
    try {
      strategy.parse(input(patch), ctx)
      fail('expected a validation error')
    } catch (error) {
      expect((error as AppException).code).toBe('VALIDATION_FAILED')
      expect(Object.keys((error as AppException).fields ?? {})[0]).toContain(field)
    }
  })

  /*
   * A past departure is one mistake in the request. Letting it through would surface as five
   * identical "ineligible" cards, which reads as five insurers refusing the customer.
   */
  it('rejects a departure date in the past', () => {
    try {
      strategy.parse(input({ startDate: '2026-08-01', endDate: '2026-08-05' }), ctx)
      fail('expected a validation error')
    } catch (error) {
      expect((error as AppException).fields).toEqual({
        startDate: 'تاریخ شروع سفر نمی‌تواند در گذشته باشد',
      })
    }
  })

  it('accepts a departure later today', () => {
    expect(strategy.parse(input({ startDate: '2026-08-20', endDate: '2026-08-27' }), ctx)).toBeTruthy()
  })
})

describe('TravelRatingStrategy.rate', () => {
  const strategy = new TravelRatingStrategy()
  const rate = (over: Record<string, unknown> = {}, t: TravelRateTable = table) =>
    strategy.rate(strategy.parse(input(over), ctx), t)

  it('prices base × duration × coverage × age, then fee and tax', () => {
    const result = rate()
    // 1,000,000 × 1 (7 days) × 1 (EUR_30K) × 1 (age 36) = 1,000,000
    expect(result.netPremium).toBe(1_000_000)
    expect(result.totalAmount).toBe(1_120_000) // + 20,000 stamp + 100,000 tax
    expect(result.eligible).toBe(true)
  })

  it.each([
    ['longer trip crosses a duration band', { endDate: '2026-09-12' }, 2_000_000],
    ['higher cover doubles it', { coverageLimit: 'EUR_50K' }, 2_000_000],
    ['a child is half price', { travelers: [traveler('2020-01-15')] }, 500_000],
    ['an older traveler is loaded', { travelers: [traveler('1950-01-15')] }, 3_000_000],
    ['a cheaper zone', { destinationZone: 'ASIA' }, 500_000],
  ])('%s', (_label, patch, expectedNet) => {
    expect(rate(patch).netPremium).toBe(expectedNet)
  })

  it('gives each traveler their own invoice line, priced on their own age', () => {
    const result = rate({ travelers: [traveler(), traveler('2020-01-15')] })

    const premiums = result.lineItems.filter((i) => i.kind === 'PREMIUM')
    expect(premiums).toHaveLength(2)
    expect(premiums[0]?.amount).toBe(1_000_000)
    expect(premiums[1]?.amount).toBe(500_000)
    // Anonymous at quote time, so lines are numbered rather than named.
    expect(premiums[0]?.labelFa).toBe('حق بیمه — مسافر ۱')
    expect(premiums[1]?.labelFa).toBe('حق بیمه — مسافر ۲')
    expect(result.netPremium).toBe(1_500_000)
  })

  it('shows the chosen limit as the medical coverage value', () => {
    const result = rate({ coverageLimit: 'EUR_50K' })
    expect(result.coverages.find((c) => c.key === 'medical')?.valueFa).toBe('۵۰ هزار یورو')
    // Other coverages pass through untouched.
    expect(result.coverages.find((c) => c.key === 'baggage')?.valueFa).toBe('تا ۵۰۰ یورو')
  })

  it('explains every factor it applied, in fully Persian numerals', () => {
    const result = rate({ endDate: '2026-09-12' }) // duration factor 2, coverage 1
    const trace = result.explain.join('\n')

    expect(trace).toContain('مقصد: اروپا (شنگن)')
    expect(trace).toContain('۳۶ سال')
    expect(trace).not.toMatch(/[0-9]/)
    // A Latin dot in a Persian number reads as broken — the separator must be ٫ (U+066B).
    expect(trace).not.toContain('.')
  })

  it('writes fractional factors with the Persian decimal separator', () => {
    const fractional = { ...table, durationBands: [{ max: 15, factor: 1.5 }] }
    const result = strategy.rate(strategy.parse(input(), ctx), fractional)
    expect(result.explain.join('\n')).toContain('ضریب ۱٫۵')
    expect(result.explain.join('\n')).not.toContain('۱.۵')
  })

  describe('refusals are results, not exceptions', () => {
    it('refuses a traveler above the insurer age limit, naming the limit', () => {
      const result = rate({ travelers: [traveler('1930-01-15')] })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toBe('این شرکت مسافر بالای ۸۰ سال را پوشش نمی‌دهد.')
      expect(result.totalAmount).toBe(0)
    })

    it('refuses a trip longer than the insurer allows', () => {
      const result = rate({ endDate: '2026-10-15' })
      expect(result.ineligibleReasonFa).toBe('حداکثر مدت سفر قابل بیمه ۱۵ روز است.')
    })

    it('refuses a destination the table does not price', () => {
      const result = rate({ destinationZone: 'WORLDWIDE' })
      expect(result.ineligibleReasonFa).toBe('این مقصد توسط این شرکت پوشش داده نمی‌شود.')
    })

    it('refuses a cover level the table does not offer', () => {
      const result = rate({ coverageLimit: 'EUR_100K' })
      expect(result.ineligibleReasonFa).toBe('این سقف پوشش توسط این شرکت ارائه نمی‌شود.')
    })

    // A broken table is that insurer's problem, not everyone's.
    it('drops an insurer with a malformed table instead of throwing', () => {
      const result = strategy.rate(strategy.parse(input(), ctx), { zoneBase: 'nonsense' })
      expect(result.eligible).toBe(false)
      expect(result.ineligibleReasonFa).toBe('نرخ این شرکت در حال حاضر در دسترس نیست.')
    })
  })

  it('is pure — the same input and table always give the same price', () => {
    const parsed = strategy.parse(input(), ctx)
    const runs = Array.from({ length: 5 }, () => strategy.rate(parsed, table).totalAmount)
    expect(new Set(runs).size).toBe(1)
  })
})

interface TeaserBasket {
  destinationZone: string
  startDate: string
  endDate: string
  coverageLimit: string
  travelers: { birthDate: string }[]
}

describe('TravelRatingStrategy.teaserInputs', () => {
  const strategy = new TravelRatingStrategy()
  const baskets = strategy.teaserInputs(ctx) as TeaserBasket[]

  it('offers one basket per destination zone, so the cheapest is found not guessed', () => {
    expect(baskets).toHaveLength(5)
    expect(new Set(baskets.map((b) => b.destinationZone)).size).toBe(5)
  })

  /*
   * The teaser has to be a price someone can actually pay. Rating it off a newborn's age
   * factor would produce a headline number no real customer could ever reach.
   */
  it('uses an ordinary 35-year-old adult on a short trip at the lowest cover', () => {
    const basket = baskets[0]!
    expect(ageOnDeparture(basket.travelers[0]!.birthDate, basket.startDate)).toBe(35)
    expect(basket.coverageLimit).toBe('EUR_15K')

    const days =
      (Date.parse(basket.endDate) - Date.parse(basket.startDate)) / 86_400_000
    expect(days).toBe(7)
  })

  // parse() rejects past departures, so a teaser basket must never be one.
  it('produces baskets that parse cleanly at the same instant', () => {
    for (const basket of baskets) {
      expect(() => strategy.parse(basket, ctx)).not.toThrow()
    }
  })
})
