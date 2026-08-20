import type { ProductType } from '@prisma/client'
import type { RatingResult } from './rating.types'

/**
 * The narrow slice of the database a rating strategy may depend on.
 *
 * Home fire rates on the seismic zone of the city the customer picked, which is reference data
 * the request can only name by id — and letting the client send the zone itself would let them
 * choose their own price band. Strategies get this port rather than Prisma so they stay
 * ignorant of persistence, and `rate()` stays pure: everything it needs is resolved *before*
 * it runs, once per quote rather than once per insurer.
 */
export interface RatingLookups {
  /** Seismic zone 1..4 for a city, or null when the id matches nothing. */
  cityQuakeZone(cityId: string): Promise<number | null>
  /** Every city's id and zone. Small reference table; used to build teaser baskets. */
  cityQuakeZones(): Promise<{ id: string; quakeZone: number }[]>
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
   * Validates raw request input and narrows it. Throws `AppException` when invalid.
   *
   * Receives the clock because some validity rules need it — "the trip cannot start in the
   * past" is a mistake in the request, not five insurers independently refusing the customer.
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
}

export const RATING_STRATEGIES = Symbol('RATING_STRATEGIES')
