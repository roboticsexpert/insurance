import { z } from 'zod'

/**
 * The shape a home-fire rate table must have. Validated at rate time rather than trusted, so
 * one insurer's malformed table drops that insurer instead of blanking the comparison.
 *
 * Fire cover is rated on the **sum insured**, not on floor area — a 200m² flat full of nothing
 * is a smaller loss than a 60m² one full of everything. `areaSqm` is therefore an eligibility
 * limit here, not a premium driver.
 */
const rateFraction = z.number().min(0).max(1)

/** Which half of the sum insured a peril attaches to. Theft is a contents peril; fire is both. */
const peril = z.object({
  basis: z.enum(['BUILDING', 'CONTENTS', 'BOTH']),
  rate: rateFraction,
  /** Earthquake only: multiplies the rate by the city's seismic zone factor. */
  zoneFactors: z.record(z.number().positive()).optional(),
})

export const homeFireRateTableSchema = z.object({
  meta: z.object({ source: z.string() }).passthrough(),
  /** Annual rate on each half of the sum insured, for the always-included perils. */
  baseRates: z.record(
    z.object({ building: rateFraction, contents: rateFraction }),
  ),
  perilRates: z.record(peril),
  /**
   * The floor below which a policy costs more to administer than it earns. Real fire policies
   * all carry one; without it a ۵۰ million Rial contents-only cover would price at pennies.
   */
  minPremium: z.number().nonnegative(),
  taxRate: rateFraction,
  fees: z.array(z.object({ key: z.string(), labelFa: z.string(), amount: z.number() })),
  coverages: z.array(
    z.object({
      key: z.string(),
      labelFa: z.string(),
      valueFa: z.string(),
      highlight: z.boolean().optional(),
    }),
  ),
  limits: z.object({ maxSumInsured: z.number().positive(), maxAreaSqm: z.number().positive() }),
})

export type HomeFireRateTable = z.infer<typeof homeFireRateTableSchema>
