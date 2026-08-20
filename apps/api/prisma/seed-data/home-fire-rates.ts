/**
 * Home-fire (آتش‌سوزی منزل) rate tables.
 *
 * ⚠️ EVERY NUMBER HERE IS A PLACEHOLDER. The *structure* is how the cover is really priced —
 * a rate per mille on each half of the sum insured, add-on perils each attaching to the half
 * they can actually damage, earthquake loaded by the city's seismic zone, and a premium floor —
 * but the values are plausible inventions. `meta.source` says so on every row and the UI must
 * show the «نمونه» badge until real tables replace these.
 *
 * The seismic zones the earthquake factor reads come from `cities.ts`, and are themselves
 * approximate: the official استاندارد ۲۸۰۰ zoning must be sourced before this ships for real.
 */
export interface Peril {
  basis: 'BUILDING' | 'CONTENTS' | 'BOTH'
  rate: number
  zoneFactors?: Record<string, number>
}

export interface HomeFireRateTable {
  meta: { source: 'PLACEHOLDER'; currency: 'IRR'; note: string }
  baseRates: Record<string, { building: number; contents: number }>
  perilRates: Record<string, Peril>
  minPremium: number
  taxRate: number
  fees: { key: string; labelFa: string; amount: number }[]
  coverages: { key: string; labelFa: string; valueFa: string; highlight?: boolean }[]
  limits: { maxSumInsured: number; maxAreaSqm: number }
}

interface InsurerProfile {
  slug: string
  /** Scales every rate, so insurers are not all the same price. */
  priceIndex: number
  /** How hard this insurer loads the high-seismic zones. */
  quakeLoading: number
  maxSumInsured: number
  featuresFa: string[]
}

/*
 * Only the insurers that actually sell home fire, per `products.ts`. The catalog decides who
 * offers a product; a rate table for an insurer with no `Offering` row has nothing to attach to.
 */
const PROFILES: InsurerProfile[] = [
  {
    slug: 'pasargad',
    priceIndex: 1.0,
    quakeLoading: 1.0,
    maxSumInsured: 200_000_000_000,
    featuresFa: ['کارشناسی رایگان محل', 'پرداخت خسارت بدون استهلاک'],
  },
  {
    slug: 'saman',
    priceIndex: 0.94,
    quakeLoading: 1.15,
    maxSumInsured: 150_000_000_000,
    featuresFa: ['نرخ مناسب آپارتمان', 'صدور آنی'],
  },
  {
    slug: 'dey',
    priceIndex: 0.9,
    quakeLoading: 1.3,
    maxSumInsured: 100_000_000_000,
    featuresFa: ['اقتصادی‌ترین نرخ', 'مناسب اثاثیه'],
  },
]

/** Rates are per mille of the sum insured; six decimals keeps them exact after scaling. */
const rate = (perMille: number, index: number): number =>
  Number(((perMille / 1000) * index).toFixed(6))

function buildTable(profile: InsurerProfile): HomeFireRateTable {
  const r = (perMille: number) => rate(perMille, profile.priceIndex)
  const zone = (factor: number) => Number((factor * profile.quakeLoading).toFixed(3))

  return {
    meta: {
      source: 'PLACEHOLDER',
      currency: 'IRR',
      note: 'نرخ نمونه — جایگزینی با نرخ واقعی شرکت بیمه لازم است.',
    },
    baseRates: {
      // A villa is detached, often further from a fire station, and burns alone.
      APARTMENT: { building: r(0.25), contents: r(0.55) },
      VILLA: { building: r(0.38), contents: r(0.7) },
    },
    perilRates: {
      EARTHQUAKE: {
        basis: 'BOTH',
        rate: r(0.4),
        // Zone 1 is the highest seismic risk; zone 4 the lowest.
        zoneFactors: { '1': zone(2.2), '2': zone(1.5), '3': zone(1), '4': zone(0.7) },
      },
      FLOOD: { basis: 'BOTH', rate: r(0.15) },
      // Thieves take belongings, not walls.
      THEFT: { basis: 'CONTENTS', rate: r(0.9) },
      WATER_DAMAGE: { basis: 'BOTH', rate: r(0.2) },
    },
    minPremium: Math.round(1_500_000 * profile.priceIndex),
    taxRate: 0.1,
    fees: [{ key: 'stamp', labelFa: 'حق تمبر', amount: 20_000 }],
    coverages: [
      { key: 'liability', labelFa: 'مسئولیت در برابر همسایگان', valueFa: 'تا ۱۰٪ سرمایه' },
      { key: 'debris', labelFa: 'هزینه پاک‌سازی آوار', valueFa: 'تا ۵٪ سرمایه' },
      { key: 'duration', labelFa: 'مدت بیمه‌نامه', valueFa: 'یک سال' },
    ],
    limits: { maxSumInsured: profile.maxSumInsured, maxAreaSqm: 2000 },
  }
}

export const HOME_FIRE_RATE_TABLES = PROFILES.map((profile) => ({
  insurerSlug: profile.slug,
  featuresFa: profile.featuresFa,
  table: buildTable(profile),
}))
