import { z } from 'zod'

/**
 * The shape a travel rate table must have. Validated at rate time rather than trusted, so a
 * malformed table takes that one insurer out of the comparison instead of throwing and
 * blanking the whole screen.
 */
const band = z.object({ max: z.number(), factor: z.number().positive() })

export const travelRateTableSchema = z.object({
  meta: z.object({ source: z.string() }).passthrough(),
  zoneBase: z.record(z.number().nonnegative()),
  durationBands: z.array(band).min(1),
  ageBands: z.array(band).min(1),
  coverageFactors: z.record(z.number().positive()),
  taxRate: z.number().min(0).max(1),
  fees: z.array(z.object({ key: z.string(), labelFa: z.string(), amount: z.number() })),
  coverages: z.array(
    z.object({
      key: z.string(),
      labelFa: z.string(),
      valueFa: z.string(),
      highlight: z.boolean().optional(),
    }),
  ),
  limits: z.object({ maxAge: z.number(), maxDays: z.number() }),
})

export type TravelRateTable = z.infer<typeof travelRateTableSchema>
