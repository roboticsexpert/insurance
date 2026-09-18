import type { ProductType } from '@prisma/client'
import type { CoverageItem, RatingResult } from './rating.types'

/**
 * The narrow slice of the database a rating strategy may depend on.
 *
 * Home fire rates on the seismic zone of the city the customer picked, which is reference data
 * the request can only name by id — and letting the client send the zone itself would let them
 * choose their own price band. Strategies get this port rather than Prisma so they stay
 * ignorant of persistence, and `rate()` stays pure: everything it needs is resolved *before*
 * it runs, once per quote rather than once per insurer.
 *
 * The `*Name` members serve `riskSummary()` rather than pricing: a policy has to say what it
 * covers in words a human reads, and the request only ever names a city or a vehicle by id.
 */
export interface RatingLookups {
  /** Seismic zone 1..4 for a city, or null when the id matches nothing. */
  cityQuakeZone(cityId: string): Promise<number | null>
  /** Every city's id and zone. Small reference table; used to build teaser baskets. */
  cityQuakeZones(): Promise<{ id: string; quakeZone: number }[]>
  /** «تهران / تهران» for the policy document, or null when the id matches nothing. */
  cityName(cityId: string): Promise<string | null>
  /**
   * The group a vehicle model belongs to, or null when the id matches nothing.
   *
   * Motor TPL rates on the group, and the group spans a factor of 24 between a motorcycle and
   * a truck — so it is the catalog's answer that prices the policy, never the client's claim.
   */
  vehicleModelGroup(vehicleModelId: string): Promise<string | null>
  /** Every active model's id and group. Small reference table; used to build teaser baskets. */
  vehicleModelGroups(): Promise<{ id: string; group: string }[]>
  /** «ایران خودرو پژو ۲۰۶» for the policy document, or null when the id matches nothing. */
  vehicleModelName(vehicleModelId: string): Promise<string | null>
}

export interface RatingContext {
  /**
   * Every price is computed as of this instant. Passed in rather than read from the clock so
   * `rate()` stays a pure function — the same inputs must always produce the same price, which
   * is what makes a quote reproducible a year later when someone asks why it cost that much.
   */
  now: Date
}

/**
 * One per product type. Implementations must be pure: no I/O, no `Date.now()`, no randomness.
 * Everything they need arrives as an argument.
 */
export interface RatingStrategy<TInput = unknown, TPrepared = TInput> {
  readonly productType: ProductType

  /**
   * Narrows raw input to the product's shape. Throws `AppException` when malformed.
   *
   * Takes no clock, and must not: this is the question "is this well-formed?", whose answer can
   * never change once an order exists. Issuance calls this — and only this — to re-derive the
   * coverage period from a stored quote. See `admission.ts` for why that separation matters.
   */
  decode(input: unknown): TInput

  /**
   * `decode` plus the clock-relative admission rules — "may this be bought right now?".
   *
   * The request path calls this. "The trip cannot start in the past" is a mistake in the
   * request, not five insurers independently refusing the customer, so it is answered once here.
   */
  parse(input: unknown, ctx: RatingContext): TInput

  /**
   * Resolves whatever `rate()` needs that lives in the database — once per quote, before any
   * insurer is priced. Omitted by products that need nothing, which is why `TPrepared`
   * defaults to `TInput`.
   */
  prepare?(input: TInput, lookups: RatingLookups): Promise<TPrepared>

  /** `(input, table, ctx) → result`. The whole pricing surface, testable with fixtures. */
  rate(input: TPrepared, table: unknown, ctx: RatingContext): RatingResult

  /**
   * Candidate "cheapest realistic purchase" baskets, used to derive the «از … تومان» teaser.
   *
   * Several are returned rather than one so the cheapest option can be *found* instead of
   * assumed — which zone or tier is cheapest is a property of the rate tables, and hardcoding
   * a guess here would go stale the moment a table changes.
   *
   * They must be baskets an actual customer could buy. A teaser priced off a newborn's age
   * factor is a number nobody can ever pay.
   */
  teaserInputs?(ctx: RatingContext, lookups: RatingLookups): unknown[] | Promise<unknown[]>

  /**
   * When cover starts and ends for this input. Lives with the strategy because only the
   * product knows: a travel policy runs for the trip, a motor policy for a year from its
   * start date.
   */
  coveragePeriod(input: TInput): { startsAt: Date; endsAt: Date }

  /**
   * **What is insured**, as label/value rows for the issued policy.
   *
   * Not the same question as `coverages()`, which says what the insurer will pay for. A شخص
   * ثالث policy that never states the plate, or a fire policy that never states the address, is
   * not a usable document however correct its limits are — and the data was already sitting in
   * the snapshot, undeclared and unrendered.
   *
   * Takes the lookups port because a request names a city or a vehicle by id, and a policy has
   * to print a name. Resolved once, at issuance, into the snapshot — never joined at render
   * time, so a policy still reads correctly after the catalog row it came from is gone.
   */
  riskSummary?(input: TInput, lookups: RatingLookups): Promise<CoverageItem[]>
}

export const RATING_STRATEGIES = Symbol('RATING_STRATEGIES')
