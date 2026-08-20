/**
 * Motor third-party (شخص ثالث) rate tables.
 *
 * ⚠️ EVERY NUMBER HERE IS A PLACEHOLDER. The *structure* is how the cover is really priced —
 * both premiums derive from دیه, the property limit is a regulator-set percentage of it, the
 * no-claims ladders are statutory, and the levies sit outside the premium — but the values are
 * plausible inventions, not published insurer rates. `meta.source` says so on every row and the
 * UI must show the «نمونه» badge until real tables replace these.
 *
 * The premium is:
 *   bodily   = دیه × bodilyBaseRate × groupFactor × usageFactor × vehicleAgeFactor
 *   property = (دیه × tier%) × propertyBaseRate × groupFactor × usageFactor
 * each less its own no-claims discount, then the bodily fund levy, the flat levies, and VAT.
 *
 * Not modelled, and deliberately: دیه rises by a third in the four ماه‌های حرام. Real tables
 * will need it; inventing the rule on top of invented numbers would only look authoritative.
 */

export interface Band {
  /** Inclusive upper bound. The first band whose bound is met wins. */
  max: number
  factor: number
}

export interface MotorTplRateTable {
  meta: { source: 'PLACEHOLDER'; currency: 'IRR'; note: string }
  /** دیه ماه عادی — the national bodily-injury limit, in Rial. Reset every year. */
  diyeAmount: number
  bodilyBaseRate: number
  propertyBaseRate: number
  groupFactors: Record<string, number>
  usageFactors: Record<string, number>
  vehicleAgeBands: Band[]
  /** index = years without a bodily claim, 0–14. */
  bodilyDiscountLadder: number[]
  /** index = years without a property claim, 0–8. */
  propertyDiscountLadder: number[]
  taxRate: number
  levies: {
    bodilyFundRate: number
    fixed: { key: string; labelFa: string; amount: number }[]
  }
  coverages: { key: string; labelFa: string; valueFa: string; highlight?: boolean }[]
  limits: { maxVehicleAgeYears: number }
}

/** دیه for the 1405 policy year — one number, and the whole table follows it. */
const DIYE_RIAL = 13_500_000_000

/** Statutory: 0–14 years bodily, topping out at 70%. */
const BODILY_LADDER = [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.68, 0.7]
/** Statutory: 0–8 years property, topping out at 60%. */
const PROPERTY_LADDER = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6]

interface InsurerProfile {
  slug: string
  /** Scales both premiums, so insurers are not all the same price. */
  priceIndex: number
  /** Some insurers load commercial and taxi use far harder than others. */
  commercialLoading: number
  /** Some refuse older vehicles outright. */
  maxVehicleAgeYears: number
  featuresFa: string[]
}

const PROFILES: InsurerProfile[] = [
  {
    slug: 'pasargad',
    priceIndex: 1.0,
    commercialLoading: 1.0,
    maxVehicleAgeYears: 30,
    featuresFa: ['پرداخت خسارت در محل', 'شبکه تعمیرگاهی مجاز'],
  },
  {
    slug: 'saman',
    priceIndex: 0.95,
    commercialLoading: 1.12,
    maxVehicleAgeYears: 25,
    featuresFa: ['نرخ مناسب خودروی شخصی', 'صدور آنی الحاقیه'],
  },
  {
    slug: 'karafarin',
    priceIndex: 1.06,
    commercialLoading: 0.9,
    maxVehicleAgeYears: 35,
    featuresFa: ['مناسب ناوگان تجاری', 'کارشناسی سریع خسارت'],
  },
  {
    slug: 'dey',
    priceIndex: 0.91,
    commercialLoading: 1.25,
    maxVehicleAgeYears: 20,
    featuresFa: ['اقتصادی‌ترین نرخ', 'صدور فوری'],
  },
  {
    slug: 'alborz',
    priceIndex: 1.03,
    commercialLoading: 1.02,
    maxVehicleAgeYears: 30,
    featuresFa: ['شعب سراسر کشور', 'سابقه طولانی در شخص ثالث'],
  },
]

const factor = (value: number): number => Number(value.toFixed(3))

function buildTable(profile: InsurerProfile): MotorTplRateTable {
  return {
    meta: {
      source: 'PLACEHOLDER',
      currency: 'IRR',
      note: 'نرخ نمونه — جایگزینی با نرخ مصوب بیمه مرکزی لازم است.',
    },
    diyeAmount: DIYE_RIAL,
    bodilyBaseRate: factor(0.0085 * profile.priceIndex),
    propertyBaseRate: factor(0.042 * profile.priceIndex),
    groupFactors: {
      SEDAN: 1,
      PICKUP: 1.15,
      VAN: 1.35,
      TRUCK: 1.9,
      MOTORCYCLE: 0.08,
    },
    usageFactors: {
      PERSONAL: 1,
      COMMERCIAL: factor(1.25 * profile.commercialLoading),
      TAXI: factor(1.45 * profile.commercialLoading),
    },
    vehicleAgeBands: [
      { max: 5, factor: 1 },
      { max: 10, factor: 1.05 },
      { max: 15, factor: 1.12 },
      { max: 25, factor: 1.2 },
      { max: 60, factor: 1.3 },
    ],
    bodilyDiscountLadder: BODILY_LADDER,
    propertyDiscountLadder: PROPERTY_LADDER,
    taxRate: 0.1,
    levies: {
      bodilyFundRate: 0.08,
      fixed: [
        { key: 'traffic', labelFa: 'عوارض راهنمایی و رانندگی', amount: 400_000 },
        { key: 'stamp', labelFa: 'حق تمبر', amount: 20_000 },
      ],
    },
    coverages: [
      { key: 'driver', labelFa: 'حوادث راننده', valueFa: 'تا سقف دیه، طبق قانون' },
      { key: 'sanhab', labelFa: 'ثبت در سامانه سنهاب', valueFa: 'آنی' },
      { key: 'territory', labelFa: 'محدوده پوشش', valueFa: 'داخل کشور' },
    ],
    limits: { maxVehicleAgeYears: profile.maxVehicleAgeYears },
  }
}

export const MOTOR_TPL_RATE_TABLES = PROFILES.map((profile) => ({
  insurerSlug: profile.slug,
  featuresFa: profile.featuresFa,
  table: buildTable(profile),
}))
