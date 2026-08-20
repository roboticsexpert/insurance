/**
 * Which products this build can actually quote.
 *
 * A product becomes *priceable* the moment its rate tables are seeded — that is the API's
 * business, and `fromAmount` follows it automatically. Whether there is a **form** to collect
 * the input is the web's business, and the two land in separate releases: the rating strategy
 * ships before the wizard. Without this the home card would offer «از … تومان» on a product
 * whose form route does not exist yet, and the tap would land on the 404 screen.
 *
 * The router builds its wizard routes from the same list, so a new wizard cannot be added to
 * one and forgotten in the other.
 */
export const WIZARD_SLUGS = ['travel', 'motor-tpl', 'home-fire'] as const

export type WizardSlug = (typeof WIZARD_SLUGS)[number]

export const hasWizard = (slug: string): slug is WizardSlug =>
  (WIZARD_SLUGS as readonly string[]).includes(slug)
