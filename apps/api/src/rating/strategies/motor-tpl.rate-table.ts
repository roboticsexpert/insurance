import { z } from 'zod'

/**
 * The shape a motor third-party rate table must have. Validated at rate time rather than
 * trusted, so one insurer's malformed table drops that insurer from the comparison instead of
 * blanking the whole screen.
 *
 * The structure follows how شخص ثالث is genuinely priced in Iran: both premiums derive from
 * **دیه** — the national bodily-injury limit, reset every year — so a table stays correct for
 * a new year by changing one number. The property limit is a regulator-defined percentage of
 * the same figure, which is why `PROPERTY_TIER_PERCENT` lives with the input schema and not
 * here: the ladder is law, not an insurer's choice.
 */
const band = z.object({ max: z.number(), factor: z.number().positive() })

/** A no-claims ladder: index = years without a claim, value = fraction discounted. */
const discountLadder = z.array(z.number().min(0).max(1)).min(1)

export const motorTplRateTableSchema = z.object({
  meta: z.object({ source: z.string() }).passthrough(),
  /** دیه, in Rial. Both premiums and the property limit are computed from it. */
  diyeAmount: z.number().positive(),
  /** Bodily premium as a fraction of دیه, before any factor. */
  bodilyBaseRate: z.number().positive(),
  /** Property premium as a fraction of the *chosen property limit*, not of دیه. */
  propertyBaseRate: z.number().positive(),
  groupFactors: z.record(z.number().positive()),
  usageFactors: z.record(z.number().positive()),
  /** Banded on the vehicle's age in Jalali years at the policy start. */
  vehicleAgeBands: z.array(band).min(1),
  bodilyDiscountLadder: discountLadder,
  propertyDiscountLadder: discountLadder,
  taxRate: z.number().min(0).max(1),
  /**
   * Statutory levies, kept out of the premium because a real invoice shows them separately —
   * the customer is entitled to see what the state took and what the insurer took.
   */
  levies: z.object({
    /** صندوق تأمین خسارت‌های بدنی — a fraction of the bodily premium *after* its discount. */
    bodilyFundRate: z.number().min(0).max(1),
    /** Flat per-policy charges: عوارض راهنمایی و رانندگی, حق تمبر. */
    fixed: z.array(z.object({ key: z.string(), labelFa: z.string(), amount: z.number() })),
  }),
  /** Cover that does not depend on the customer's choices; the two limits are added at rate time. */
  coverages: z.array(
    z.object({
      key: z.string(),
      labelFa: z.string(),
      valueFa: z.string(),
      highlight: z.boolean().optional(),
    }),
  ),
  limits: z.object({ maxVehicleAgeYears: z.number() }),
})

export type MotorTplRateTable = z.infer<typeof motorTplRateTableSchema>
