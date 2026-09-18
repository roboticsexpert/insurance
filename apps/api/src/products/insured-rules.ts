import type { ProductType } from '@prisma/client'

/**
 * Who a product's policy names, and what identifies them.
 *
 * This lived only in the web app (`checkout.ts`), which meant every rule here was enforced
 * client-side and nowhere else: a direct `POST /orders` could name ten people on a motor policy,
 * or issue a travel policy with no passport number on it. The API owns it now — the checkout
 * screen may still shape the form from the same rules, but it is no longer the one deciding.
 */
export interface InsuredRule {
  /** How many people the policy names. */
  count(input: unknown): number

  /**
   * The birth dates the premium was computed from, **in the order the policy lists them** —
   * or `null` for a product that prices nobody individually.
   *
   * Order matters. The travel document pairs the insured table against position-labelled
   * premium lines («حق بیمه — مسافر ۱»), so accepting the travelers in any order and sorting
   * before comparing produced policies whose own breakdown contradicted itself.
   */
  pricedBirthDates(input: unknown): readonly string[] | null

  /** Whether a passport number is part of how this product identifies the insured. */
  requiresPassport: boolean

  /** What the product calls the person, so errors read the way the screen does. */
  subjectFa: string
}

const travelers = (input: unknown): { birthDate: string }[] => {
  const list = (input as { travelers?: unknown } | null)?.travelers
  return Array.isArray(list) ? (list as { birthDate: string }[]) : []
}

/** Motor and fire both name exactly one بیمه‌گذار: the owner of the risk. */
const singleHolder = (subjectFa: string): InsuredRule => ({
  count: () => 1,
  pricedBirthDates: () => null,
  requiresPassport: false,
  subjectFa,
})

export const INSURED_RULES: Record<ProductType, InsuredRule> = {
  TRAVEL: {
    count: (input) => travelers(input).length,
    pricedBirthDates: (input) => travelers(input).map((t) => t.birthDate),
    requiresPassport: true,
    subjectFa: 'بیمه‌شده',
  },
  MOTOR_TPL: singleHolder('بیمه‌گذار'),
  HOME_FIRE: singleHolder('بیمه‌گذار'),
}
