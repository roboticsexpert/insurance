import type { ProductType } from './catalog-api'
import { formatJalali } from './fa'

/**
 * What checkout has to collect, per product.
 *
 * The three products disagree about almost everything on this screen: travel names one insured
 * per traveller and already knows their ages, while motor and home name a single بیمه‌گذار whose
 * birth date nobody has asked for yet. Travel runs between two dates the customer chose; the
 * other two run for a year from one. Reading those differences off the quote inside the
 * component is how `CheckoutPage` ended up travel-shaped — and how it came to call
 * `formatJalali(input.endDate)` on inputs that have no `endDate`, which throws.
 *
 * So the differences live here, as data, and the screen renders whatever it is handed.
 */
export interface CheckoutPerson {
  /** Gregorian `YYYY-MM-DD`, or null when the customer still has to supply it. */
  birthDate: string | null
  /**
   * Travel is priced on age, so a birth date that came from the quote is shown and locked —
   * editing it here would only earn a rejection from the server.
   */
  birthDateLocked: boolean
}

export interface CheckoutShape {
  /** One card per person who must be named on the policy. */
  seeds: CheckoutPerson[]
  /** What to call them: «بیمه‌شده» for travel, «بیمه‌گذار» for the single-holder products. */
  subjectFa: string
  headingFa: string
  hintFa: string
  /** The passport number is what a travel insurer and an embassy use. Nobody else needs one. */
  requiresPassport: boolean
  /** The cover period, phrased the way the product is actually sold. Empty when unreadable. */
  periodFa: string
}

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

/** Never hand `formatJalali` something it will throw on — that is the bug this module exists for. */
const jalaliOrEmpty = (value: unknown): string => (isIsoDate(value) ? formatJalali(value) : '')

const readTravelers = (input: unknown): string[] => {
  const travelers = (input as { travelers?: unknown })?.travelers
  if (!Array.isArray(travelers)) return []
  return travelers.map((t) => (t as { birthDate?: unknown })?.birthDate).filter(isIsoDate)
}

const readStartDate = (input: unknown): unknown => (input as { startDate?: unknown })?.startDate

/** A single holder, born on a date we do not have yet. */
const oneHolder = (): CheckoutPerson[] => [{ birthDate: null, birthDateLocked: false }]

const annualPeriod = (input: unknown): string => {
  const start = jalaliOrEmpty(readStartDate(input))
  return start ? `از ${start} · یک‌ساله` : ''
}

export function checkoutShape(productType: ProductType, input: unknown): CheckoutShape {
  switch (productType) {
    case 'TRAVEL': {
      const dates = readTravelers(input)
      const start = jalaliOrEmpty(readStartDate(input))
      const end = jalaliOrEmpty((input as { endDate?: unknown })?.endDate)
      return {
        seeds: dates.map((birthDate) => ({ birthDate, birthDateLocked: true })),
        subjectFa: 'بیمه‌شده',
        headingFa: 'مشخصات بیمه‌شدگان',
        hintFa: 'همان‌طور که در گذرنامه آمده وارد کنید؛ این اطلاعات روی بیمه‌نامه درج می‌شود.',
        requiresPassport: true,
        periodFa: start && end ? `${start} تا ${end}` : '',
      }
    }
    case 'MOTOR_TPL':
      return {
        seeds: oneHolder(),
        subjectFa: 'بیمه‌گذار',
        headingFa: 'مشخصات بیمه‌گذار',
        hintFa: 'بیمه‌نامه شخص ثالث به نام مالک خودرو صادر می‌شود.',
        requiresPassport: false,
        periodFa: annualPeriod(input),
      }
    case 'HOME_FIRE':
      return {
        seeds: oneHolder(),
        subjectFa: 'بیمه‌گذار',
        headingFa: 'مشخصات بیمه‌گذار',
        hintFa: 'بیمه‌نامه آتش‌سوزی به نام مالک یا مستأجر ملک صادر می‌شود.',
        requiresPassport: false,
        periodFa: annualPeriod(input),
      }
  }
}
