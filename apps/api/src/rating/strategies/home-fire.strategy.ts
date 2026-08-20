import { Injectable } from '@nestjs/common'
import type { ProductType } from '@prisma/client'
import { AppException } from '../../common/app.exception'
import { formatToman, toPersianDigits, toPersianNumber } from '../../common/fa'
import type { Rial } from '../../common/money'
import { zodErrorToFields } from '../../common/pipes/zod-validation.pipe'
import {
  EXTRA_PERIL_FA,
  homeFireInputSchema,
  PROPERTY_TYPE_FA,
  type HomeFireInput,
} from '../../products/schemas/home-fire'
import { ineligible, PremiumBuilder } from '../pricing'
import type { RatingContext, RatingLookups, RatingStrategy } from '../rating-strategy'
import type { CoverageItem, RatingResult } from '../rating.types'
import { homeFireRateTableSchema, type HomeFireRateTable } from './home-fire.rate-table'

/** The input plus the one thing only the database knows: how much the ground moves here. */
export interface PreparedHomeFireInput extends HomeFireInput {
  quakeZone: number
}

/** Perils every fire policy includes; listed so the coverage table can say so out loud. */
const INCLUDED_PERILS_FA = 'آتش‌سوزی، صاعقه و انفجار'

/** The teaser buys the smallest sensible flat with no add-ons. */
const TEASER_BUILDING_VALUE = 3_000_000_000
const TEASER_CONTENTS_VALUE = 500_000_000
const TEASER_AREA_SQM = 70

const startOfDayUtc = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

@Injectable()
export class HomeFireRatingStrategy
  implements RatingStrategy<HomeFireInput, PreparedHomeFireInput>
{
  readonly productType: ProductType = 'HOME_FIRE'

  parse(input: unknown, ctx: RatingContext): HomeFireInput {
    const result = homeFireInputSchema.safeParse(input)
    if (!result.success) {
      throw new AppException('VALIDATION_FAILED', { fields: zodErrorToFields(result.error) })
    }

    const starts = new Date(`${result.data.startDate}T00:00:00Z`)
    if (starts < startOfDayUtc(ctx.now)) {
      throw new AppException('VALIDATION_FAILED', {
        fields: { startDate: 'تاریخ شروع بیمه‌نامه نمی‌تواند در گذشته باشد' },
      })
    }

    return result.data
  }

  /**
   * An unknown city is a bad *request*, not five insurers refusing — so it throws here rather
   * than becoming five identical ineligible offers. Resolved once per quote.
   */
  async prepare(input: HomeFireInput, lookups: RatingLookups): Promise<PreparedHomeFireInput> {
    const quakeZone = await lookups.cityQuakeZone(input.cityId)
    if (quakeZone === null) {
      throw new AppException('VALIDATION_FAILED', { fields: { cityId: 'شهر معتبر نیست' } })
    }
    return { ...input, quakeZone }
  }

  rate(input: PreparedHomeFireInput, rawTable: unknown): RatingResult {
    const parsed = homeFireRateTableSchema.safeParse(rawTable)
    if (!parsed.success) return ineligible('نرخ این شرکت در حال حاضر در دسترس نیست.')
    const table = parsed.data

    const base = table.baseRates[input.propertyType]
    if (!base) return ineligible('این نوع ملک توسط این شرکت پوشش داده نمی‌شود.')

    const sumInsured = input.buildingValue + input.contentsValue
    if (sumInsured > table.limits.maxSumInsured) {
      return ineligible(
        `حداکثر سرمایه قابل بیمه در این شرکت ${formatToman(table.limits.maxSumInsured)} است.`,
      )
    }
    if (input.areaSqm > table.limits.maxAreaSqm) {
      return ineligible(
        `این شرکت ملک بزرگ‌تر از ${toPersianDigits(table.limits.maxAreaSqm)} متر را بیمه نمی‌کند.`,
      )
    }

    const builder = new PremiumBuilder()
      .note(`نوع ملک: ${PROPERTY_TYPE_FA[input.propertyType]}`)
      .note(`سرمایه کل: ${formatToman(sumInsured)}`)

    if (input.buildingValue > 0) {
      builder.premium(
        'building',
        'حق بیمه ساختمان',
        input.buildingValue * base.building,
        `ساختمان: ${formatToman(input.buildingValue)}`,
      )
    }
    if (input.contentsValue > 0) {
      builder.premium(
        'contents',
        'حق بیمه اثاثیه',
        input.contentsValue * base.contents,
        `اثاثیه: ${formatToman(input.contentsValue)}`,
      )
    }

    for (const peril of input.extraPerils) {
      const config = table.perilRates[peril]
      if (!config) {
        return ineligible(`پوشش ${EXTRA_PERIL_FA[peril]} توسط این شرکت ارائه نمی‌شود.`)
      }

      const basis = basisAmount(config.basis, input)
      // A peril attached to a sum the customer did not insure costs nothing and is not shown.
      if (basis === 0) continue

      const zoneFactor = config.zoneFactors
        ? (config.zoneFactors[String(input.quakeZone)] ?? 1)
        : 1

      builder.premium(
        `peril:${peril}`,
        `پوشش ${EXTRA_PERIL_FA[peril]}`,
        basis * config.rate * zoneFactor,
        config.zoneFactors
          ? `${EXTRA_PERIL_FA[peril]}: پهنه لرزه‌ای ${toPersianDigits(input.quakeZone)} (ضریب ${toPersianNumber(zoneFactor)})`
          : undefined,
      )
    }

    /*
     * The floor is a top-up line, not a silent replacement of the total: a customer comparing
     * two insurers is entitled to see that the price they are paying is a minimum rather than
     * a computed premium.
     */
    const before = builder.build().netPremium
    if (before < table.minPremium) {
      builder.premium(
        'minimum',
        'تعدیل تا حداقل حق بیمه',
        table.minPremium - before,
        `حداقل حق بیمه این شرکت ${formatToman(table.minPremium)} است.`,
      )
    }

    for (const fee of table.fees) builder.fee(fee.key, fee.labelFa, fee.amount)
    builder.withTax(table.taxRate)

    return builder.toResult(this.coverages(table, input))
  }

  /**
   * One basket per seismic zone the seed actually contains, so «از … تومان» follows the city
   * table rather than assuming which zone is cheapest. A city has to be named by id, which is
   * why this needs the lookups port at all.
   */
  async teaserInputs(ctx: RatingContext, lookups: RatingLookups): Promise<unknown[]> {
    const cities = await lookups.cityQuakeZones()

    const oneCityPerZone = new Map<number, string>()
    for (const city of cities) {
      if (!oneCityPerZone.has(city.quakeZone)) oneCityPerZone.set(city.quakeZone, city.id)
    }

    const startDate = new Date(ctx.now.getTime() + 86_400_000).toISOString().slice(0, 10)

    return [...oneCityPerZone.values()].map((cityId) => ({
      propertyType: 'APARTMENT',
      cityId,
      areaSqm: TEASER_AREA_SQM,
      buildingValue: TEASER_BUILDING_VALUE,
      contentsValue: TEASER_CONTENTS_VALUE,
      extraPerils: [],
      durationMonths: 12,
      startDate,
    }))
  }

  /** Annual, like motor: a year from the start date, ending the day before it recurs. */
  coveragePeriod(input: HomeFireInput): { startsAt: Date; endsAt: Date } {
    const startsAt = new Date(`${input.startDate}T00:00:00Z`)
    const anniversary = Date.UTC(
      startsAt.getUTCFullYear() + 1,
      startsAt.getUTCMonth(),
      startsAt.getUTCDate(),
    )
    return { startsAt, endsAt: new Date(anniversary - 1000) }
  }

  /** The sums the customer chose, the perils always included, then the add-ons they picked. */
  private coverages(table: HomeFireRateTable, input: PreparedHomeFireInput): CoverageItem[] {
    return [
      {
        key: 'building',
        labelFa: 'سرمایه ساختمان',
        valueFa: formatToman(input.buildingValue),
        highlight: true,
      },
      {
        key: 'contents',
        labelFa: 'سرمایه اثاثیه',
        valueFa: formatToman(input.contentsValue),
        highlight: true,
      },
      { key: 'included', labelFa: 'خطرهای اصلی', valueFa: INCLUDED_PERILS_FA },
      ...input.extraPerils.map((peril) => ({
        key: `peril:${peril}`,
        labelFa: EXTRA_PERIL_FA[peril],
        valueFa: 'دارد',
      })),
      ...table.coverages,
    ]
  }
}

const basisAmount = (
  basis: 'BUILDING' | 'CONTENTS' | 'BOTH',
  input: PreparedHomeFireInput,
): Rial =>
  basis === 'BUILDING'
    ? input.buildingValue
    : basis === 'CONTENTS'
      ? input.contentsValue
      : input.buildingValue + input.contentsValue
