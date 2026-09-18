import { Injectable } from '@nestjs/common'
import type { ProductType } from '@prisma/client'
import { AppException } from '../../common/app.exception'
import { toPersianDigits, toPersianNumber } from '../../common/fa'
import { zodErrorToFields } from '../../common/pipes/zod-validation.pipe'
import {
  travelDurationDays,
  travelInputSchema,
  TRAVEL_COVERAGE_FA,
  TRAVEL_ZONE_FA,
  type TravelInput,
} from '../../products/schemas/travel'
import { ineligible, pickBand, PremiumBuilder } from '../pricing'
import { tehranDayEnd, tehranDayStart } from '../../common/tehran'
import { assertBornInThePast, assertStartDateInWindow } from '../admission'
import type { RatingContext, RatingStrategy } from '../rating-strategy'
import type { CoverageItem, RatingResult } from '../rating.types'
import { travelRateTableSchema, type TravelRateTable } from './travel.rate-table'

/** Age on the day of departure, which is what a travel policy rates on — not age today. */
export function ageOnDeparture(birthDate: string, departure: string): number {
  const born = new Date(`${birthDate}T00:00:00Z`)
  const leaves = new Date(`${departure}T00:00:00Z`)

  let age = leaves.getUTCFullYear() - born.getUTCFullYear()
  const monthDelta = leaves.getUTCMonth() - born.getUTCMonth()
  if (monthDelta < 0 || (monthDelta === 0 && leaves.getUTCDate() < born.getUTCDate())) age--
  return age
}

const DAY_MS = 86_400_000

/** The teaser assumes an ordinary adult on a short trip — a price someone could really pay. */
const TEASER_AGE = 35
const TEASER_TRIP_DAYS = 7

@Injectable()
export class TravelRatingStrategy implements RatingStrategy<TravelInput> {
  readonly productType: ProductType = 'TRAVEL'

  decode(input: unknown): TravelInput {
    const result = travelInputSchema.safeParse(input)
    if (!result.success) {
      throw new AppException('VALIDATION_FAILED', { fields: zodErrorToFields(result.error) })
    }
    return result.data
  }

  parse(input: unknown, ctx: RatingContext): TravelInput {
    const decoded = this.decode(input)
    assertStartDateInWindow(decoded.startDate, ctx, 'تاریخ شروع سفر نمی‌تواند در گذشته باشد')

    // M4: `ageOnDeparture` goes negative for a future birth date, and a negative age lands in
    // the youngest band — so an unborn traveler was quoted at the 0.65 child factor.
    decoded.travelers.forEach((traveler, index) =>
      assertBornInThePast(traveler.birthDate, ctx, `travelers.${index}.birthDate`),
    )

    return decoded
  }

  rate(input: TravelInput, rawTable: unknown): RatingResult {
    const parsed = travelRateTableSchema.safeParse(rawTable)
    if (!parsed.success) {
      // One insurer's broken configuration must not take the comparison down.
      return ineligible('نرخ این شرکت در حال حاضر در دسترس نیست.')
    }
    const table = parsed.data

    const days = travelDurationDays(input)
    if (days > table.limits.maxDays) {
      return ineligible(
        `حداکثر مدت سفر قابل بیمه ${toPersianDigits(table.limits.maxDays)} روز است.`,
        [`مدت سفر: ${toPersianDigits(days)} روز`],
      )
    }

    const zoneBase = table.zoneBase[input.destinationZone]
    if (zoneBase === undefined) {
      return ineligible('این مقصد توسط این شرکت پوشش داده نمی‌شود.')
    }

    const coverageFactor = table.coverageFactors[input.coverageLimit]
    if (coverageFactor === undefined) {
      return ineligible('این سقف پوشش توسط این شرکت ارائه نمی‌شود.')
    }

    const durationBand = pickBand(table.durationBands, days)

    const builder = new PremiumBuilder()
      .note(`مقصد: ${TRAVEL_ZONE_FA[input.destinationZone]}`)
      .note(`مدت سفر: ${toPersianDigits(days)} روز (ضریب ${toPersianNumber(durationBand.factor)})`)
      .note(
        `سقف پوشش: ${TRAVEL_COVERAGE_FA[input.coverageLimit]} (ضریب ${toPersianNumber(coverageFactor)})`,
      )

    for (const [index, traveler] of input.travelers.entries()) {
      const age = ageOnDeparture(traveler.birthDate, input.startDate)
      // Travelers are anonymous at quote time, so they are identified by position.
      const label = `مسافر ${toPersianDigits(index + 1)}`

      if (age > table.limits.maxAge) {
        return ineligible(
          `این شرکت مسافر بالای ${toPersianDigits(table.limits.maxAge)} سال را پوشش نمی‌دهد.`,
          [...builder.explain, `${label}: ${toPersianDigits(age)} سال`],
        )
      }

      const ageBand = pickBand(table.ageBands, age)
      const premium = zoneBase * durationBand.factor * coverageFactor * ageBand.factor

      builder.premium(
        `traveler:${index + 1}`,
        `حق بیمه — ${label}`,
        premium,
        `${label}، ${toPersianDigits(age)} سال (ضریب سنی ${toPersianNumber(ageBand.factor)})`,
      )
    }

    for (const fee of table.fees) builder.fee(fee.key, fee.labelFa, fee.amount)
    builder.withTax(table.taxRate)

    return builder.toResult(this.coverages(table, input))
  }

  /**
   * One basket per destination zone: an average adult, the shortest trip, the lowest cover.
   * The engine prices all of them across all insurers and keeps the minimum, so the teaser
   * follows the rate tables rather than a hardcoded guess about which zone is cheapest.
   */
  teaserInputs(ctx: RatingContext): unknown[] {
    const departure = new Date(ctx.now.getTime() + DAY_MS)
    const iso = (date: Date) => date.toISOString().slice(0, 10)

    const born = new Date(
      Date.UTC(ctx.now.getUTCFullYear() - TEASER_AGE, ctx.now.getUTCMonth(), ctx.now.getUTCDate()),
    )

    return Object.keys(TRAVEL_ZONE_FA).map((destinationZone) => ({
      destinationZone,
      startDate: iso(departure),
      endDate: iso(new Date(departure.getTime() + TEASER_TRIP_DAYS * DAY_MS)),
      coverageLimit: 'EUR_15K',
      travelers: [{ birthDate: iso(born) }],
    }))
  }

  /**
   * Travel cover runs for the trip itself: from departure to the end of the day of return —
   * both read as **Tehran** days, because that is the calendar the customer picked them from.
   * As UTC instants, cover used to begin at 03:30 local and a 06:00 flight left uninsured.
   */
  coveragePeriod(input: TravelInput): { startsAt: Date; endsAt: Date } {
    return { startsAt: tehranDayStart(input.startDate), endsAt: tehranDayEnd(input.endDate) }
  }

  /**
   * The trip. Travel is the one product whose risk the insured table already half-describes, but
   * the destination and the dates are what an embassy or a hospital abroad actually check.
   */
  riskSummary(input: TravelInput): Promise<CoverageItem[]> {
    return Promise.resolve([
      {
        key: 'destination',
        labelFa: 'مقصد',
        valueFa: TRAVEL_ZONE_FA[input.destinationZone],
        highlight: true,
      },
      {
        key: 'duration',
        labelFa: 'مدت سفر',
        valueFa: `${toPersianDigits(travelDurationDays(input))} روز`,
      },
    ])
  }

  /** The generic coverage list, with the customer's actual chosen limit filled in. */
  private coverages(table: TravelRateTable, input: TravelInput): CoverageItem[] {
    return table.coverages.map((coverage) =>
      coverage.key === 'medical'
        ? { ...coverage, valueFa: TRAVEL_COVERAGE_FA[input.coverageLimit] }
        : coverage,
    )
  }
}
