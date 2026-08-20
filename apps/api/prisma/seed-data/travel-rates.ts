/**
 * Travel rate tables.
 *
 * ⚠️ EVERY NUMBER HERE IS A PLACEHOLDER. The *structure* mirrors how travel cover is really
 * priced — zone × trip length × traveller age × cover limit, with tax and fixed levies as
 * separate line items — but the values are plausible inventions, not published insurer rates.
 * `meta.source` says so on every row, and the UI must show the «نمونه» badge until real tables
 * replace these. Shipping invented prices as if they were real is the one thing that would end
 * this project's credibility with insurers.
 *
 * The premium for one traveller is:
 *   zoneBase × durationFactor × ageFactor × coverageFactor
 * summed across travellers, then tax, then fixed fees.
 */

export interface Band {
  /** Inclusive upper bound. The first band whose bound is met wins. */
  max: number
  factor: number
}

export interface TravelRateTable {
  meta: {
    source: 'PLACEHOLDER'
    currency: 'IRR'
    note: string
  }
  /** Rial, for a 7-day trip, one adult, at the EUR_30K cover level. */
  zoneBase: Record<string, number>
  durationBands: Band[]
  ageBands: Band[]
  coverageFactors: Record<string, number>
  /** Fraction of the net premium. */
  taxRate: number
  fees: { key: string; labelFa: string; amount: number }[]
  coverages: { key: string; labelFa: string; valueFa: string; highlight?: boolean }[]
  /** Hard refusals — the engine returns ineligible rather than a price. */
  limits: { maxAge: number; maxDays: number }
}

interface InsurerProfile {
  slug: string
  /** Scales the whole table, so insurers are not all the same price. */
  priceIndex: number
  /** Some insurers load the elderly far harder than others. */
  elderlyLoading: number
  /** Some refuse older travellers outright. */
  maxAge: number
  featuresFa: string[]
}

const PROFILES: InsurerProfile[] = [
  {
    slug: 'pasargad',
    priceIndex: 1.0,
    elderlyLoading: 1.0,
    maxAge: 85,
    featuresFa: ['پرداخت خسارت ارزی', 'شبکه بیمارستانی گسترده'],
  },
  {
    slug: 'saman',
    priceIndex: 0.94,
    elderlyLoading: 1.18,
    maxAge: 80,
    featuresFa: ['ارزان‌ترین نرخ در سفرهای کوتاه', 'پشتیبانی ۲۴ ساعته'],
  },
  {
    slug: 'karafarin',
    priceIndex: 1.08,
    elderlyLoading: 0.88,
    maxAge: 88,
    featuresFa: ['مناسب سنین بالا', 'پوشش ورزش‌های تفریحی'],
  },
  {
    slug: 'dey',
    priceIndex: 0.89,
    elderlyLoading: 1.35,
    maxAge: 75,
    featuresFa: ['نرخ اقتصادی', 'صدور فوری'],
  },
  {
    slug: 'alborz',
    priceIndex: 1.02,
    elderlyLoading: 1.05,
    maxAge: 85,
    featuresFa: ['سابقه طولانی در بازار', 'شعب سراسر کشور'],
  },
]

const round = (rial: number): number => Math.round(rial / 1000) * 1000

function buildTable(profile: InsurerProfile): TravelRateTable {
  const scale = (amount: number) => round(amount * profile.priceIndex)

  return {
    meta: {
      source: 'PLACEHOLDER',
      currency: 'IRR',
      note: 'نرخ نمونه — جایگزینی با نرخ واقعی شرکت بیمه لازم است.',
    },
    zoneBase: {
      SCHENGEN: scale(2_600_000),
      ASIA: scale(1_800_000),
      AMERICAS: scale(4_200_000),
      WORLDWIDE: scale(5_000_000),
      HAJJ_OMRAH: scale(2_000_000),
    },
    durationBands: [
      { max: 7, factor: 1 },
      { max: 15, factor: 1.5 },
      { max: 31, factor: 2.2 },
      { max: 62, factor: 3.4 },
      { max: 92, factor: 4.5 },
      { max: 180, factor: 7 },
      { max: 365, factor: 11 },
    ],
    ageBands: [
      { max: 12, factor: 0.65 },
      { max: 65, factor: 1 },
      { max: 70, factor: Number((1.8 * profile.elderlyLoading).toFixed(2)) },
      { max: 75, factor: Number((2.6 * profile.elderlyLoading).toFixed(2)) },
      { max: 80, factor: Number((3.8 * profile.elderlyLoading).toFixed(2)) },
      { max: 120, factor: Number((5 * profile.elderlyLoading).toFixed(2)) },
    ],
    coverageFactors: {
      EUR_15K: 0.78,
      EUR_30K: 1,
      EUR_50K: 1.28,
      EUR_100K: 1.75,
    },
    // Placeholder: insurance VAT treatment needs confirming before any real launch.
    taxRate: 0.1,
    fees: [{ key: 'stamp', labelFa: 'حق تمبر', amount: 20_000 }],
    coverages: [
      { key: 'medical', labelFa: 'هزینه‌های درمانی', valueFa: 'تا سقف تعهد انتخابی', highlight: true },
      { key: 'repatriation', labelFa: 'بازگرداندن بیمار', valueFa: 'دارد', highlight: true },
      { key: 'baggage', labelFa: 'فقدان بار', valueFa: 'تا ۵۰۰ یورو' },
      { key: 'liability', labelFa: 'مسئولیت مدنی', valueFa: 'تا ۱۰٬۰۰۰ یورو' },
      { key: 'support', labelFa: 'پشتیبانی', valueFa: '۲۴ ساعته، فارسی' },
    ],
    limits: { maxAge: profile.maxAge, maxDays: 365 },
  }
}

export const TRAVEL_RATE_TABLES = PROFILES.map((profile) => ({
  insurerSlug: profile.slug,
  featuresFa: profile.featuresFa,
  table: buildTable(profile),
}))
