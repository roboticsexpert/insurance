import { Injectable } from '@nestjs/common'
import type { ProductType } from '@prisma/client'
import { AppException } from '../../common/app.exception'
import { formatToman, toPersianDigits, toPersianNumber } from '../../common/fa'
import { roundPremium, type Rial } from '../../common/money'
import { zodErrorToFields } from '../../common/pipes/zod-validation.pipe'
import {
  motorTplInputSchema,
  PROPERTY_TIER_PERCENT,
  VEHICLE_GROUP_FA,
  VEHICLE_USAGE_FA,
  type MotorTplInput,
} from '../../products/schemas/motor-tpl'
import { ineligible, pickBand, PremiumBuilder } from '../pricing'
import type { RatingContext, RatingStrategy } from '../rating-strategy'
import type { CoverageItem, RatingResult } from '../rating.types'
import { motorTplRateTableSchema, type MotorTplRateTable } from './motor-tpl.rate-table'

/*
 * Vehicle age is counted in **Jalali** years, because `productionYear` is the Jalali year
 * printed on the customer's green sheet — subtracting it from a Gregorian year would age every
 * car by 621.
 */
const jalaliYearParts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  year: 'numeric',
  timeZone: 'UTC',
})

export const jalaliYear = (date: Date): number =>
  Number(jalaliYearParts.formatToParts(date).find((p) => p.type === 'year')?.value ?? '0')

const startOfDayUtc = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

/** A ladder is indexed by years-without-a-claim; anything past its end sits on the top rung. */
const ladderRate = (ladder: readonly number[], years: number): number =>
  ladder[Math.min(Math.max(years, 0), ladder.length - 1)] ?? 0

/** The teaser buys the plainest legal policy: no discount history, the lowest property tier. */
const TEASER_PLATE = { twoDigit: '12', letter: 'ب', threeDigit: '345', iranCode: '10' }
const TEASER_VEHICLE_AGE_YEARS = 3

@Injectable()
export class MotorTplRatingStrategy implements RatingStrategy<MotorTplInput> {
  readonly productType: ProductType = 'MOTOR_TPL'

  parse(input: unknown, ctx: RatingContext): MotorTplInput {
    const result = motorTplInputSchema.safeParse(input)
    if (!result.success) {
      throw new AppException('VALIDATION_FAILED', { fields: zodErrorToFields(result.error) })
    }

    // Backdating cover is a mistake in the request, not five insurers independently refusing.
    const starts = new Date(`${result.data.startDate}T00:00:00Z`)
    if (starts < startOfDayUtc(ctx.now)) {
      throw new AppException('VALIDATION_FAILED', {
        fields: { startDate: 'تاریخ شروع بیمه‌نامه نمی‌تواند در گذشته باشد' },
      })
    }

    return result.data
  }

  rate(input: MotorTplInput, rawTable: unknown): RatingResult {
    const parsed = motorTplRateTableSchema.safeParse(rawTable)
    if (!parsed.success) {
      return ineligible('نرخ این شرکت در حال حاضر در دسترس نیست.')
    }
    const table = parsed.data

    const groupFactor = table.groupFactors[input.vehicleGroup]
    if (groupFactor === undefined) {
      return ineligible('این شرکت این نوع وسیله نقلیه را بیمه نمی‌کند.')
    }

    const usageFactor = table.usageFactors[input.vehicleUsage]
    if (usageFactor === undefined) {
      return ineligible('این شرکت این کاربری را پوشش نمی‌دهد.')
    }

    const vehicleAge = this.vehicleAgeYears(input)
    if (vehicleAge > table.limits.maxVehicleAgeYears) {
      return ineligible(
        `این شرکت وسیله نقلیه بالای ${toPersianDigits(table.limits.maxVehicleAgeYears)} سال را بیمه نمی‌کند.`,
        [`سن وسیله نقلیه: ${toPersianDigits(vehicleAge)} سال`],
      )
    }

    const ageBand = pickBand(table.vehicleAgeBands, vehicleAge)
    const propertyPercent = PROPERTY_TIER_PERCENT[input.propertyCoverageTier]
    const propertyLimit = Math.round((table.diyeAmount * propertyPercent) / 100)

    /*
     * Both premiums are rounded to the nearest 1,000 Rial *here*, before the discounts are
     * taken off them, so every discount line is exactly its stated percentage of the premium
     * line above it. Discounting the unrounded figure would leave an invoice whose own
     * arithmetic does not check out.
     */
    const bodily = roundPremium(
      table.diyeAmount * table.bodilyBaseRate * groupFactor * usageFactor * ageBand.factor,
    )
    const property = roundPremium(propertyLimit * table.propertyBaseRate * groupFactor * usageFactor)

    const bodilyDiscountRate = ladderRate(table.bodilyDiscountLadder, input.bodilyDiscountYears)
    const propertyDiscountRate = ladderRate(
      table.propertyDiscountLadder,
      input.propertyDiscountYears,
    )
    const bodilyDiscount = roundPremium(bodily * bodilyDiscountRate)
    const propertyDiscount = roundPremium(property * propertyDiscountRate)

    const builder = new PremiumBuilder()
      .note(`وسیله نقلیه: ${VEHICLE_GROUP_FA[input.vehicleGroup]} (ضریب ${toPersianNumber(groupFactor)})`)
      .note(`کاربری: ${VEHICLE_USAGE_FA[input.vehicleUsage]} (ضریب ${toPersianNumber(usageFactor)})`)
      .note(
        `سن وسیله نقلیه: ${toPersianDigits(vehicleAge)} سال (ضریب ${toPersianNumber(ageBand.factor)})`,
      )
      .note(`تعهد جانی (دیه): ${formatToman(table.diyeAmount)}`)
      .premium('bodily', 'حق بیمه خسارت جانی', bodily)
      .premium(
        'property',
        'حق بیمه خسارت مالی',
        property,
        `تعهد مالی: ${toPersianNumber(propertyPercent)}٪ دیه = ${formatToman(propertyLimit)}`,
      )

    if (bodilyDiscount > 0) {
      builder.discount(
        'discount:bodily',
        'تخفیف عدم خسارت جانی',
        bodilyDiscount,
        `${toPersianDigits(input.bodilyDiscountYears)} سال بدون خسارت جانی — ${this.percentFa(bodilyDiscountRate)} تخفیف`,
      )
    }
    if (propertyDiscount > 0) {
      builder.discount(
        'discount:property',
        'تخفیف عدم خسارت مالی',
        propertyDiscount,
        `${toPersianDigits(input.propertyDiscountYears)} سال بدون خسارت مالی — ${this.percentFa(propertyDiscountRate)} تخفیف`,
      )
    }

    /*
     * The fund levy rides on the *discounted* bodily premium, so a customer's no-claims record
     * reduces it too — which is how it actually works, and would be silently wrong if the levy
     * were taken off the gross figure.
     */
    const fundBase = bodily - bodilyDiscount
    builder.fee(
      'fund',
      'صندوق تأمین خسارت‌های بدنی',
      fundBase * table.levies.bodilyFundRate,
      `صندوق: ${this.percentFa(table.levies.bodilyFundRate)} از حق بیمه جانی پس از تخفیف`,
    )
    for (const fee of table.levies.fixed) builder.fee(fee.key, fee.labelFa, fee.amount)

    builder.withTax(table.taxRate)

    return builder.toResult(this.coverages(table, propertyLimit))
  }

  /**
   * One basket per vehicle group, all with no discount history and the lowest property tier.
   * The engine prices every one and keeps the minimum, so «از … تومان» follows the rate tables
   * rather than a hardcoded assumption that a motorcycle is always cheapest.
   */
  teaserInputs(ctx: RatingContext): unknown[] {
    const startDate = new Date(ctx.now.getTime() + 86_400_000).toISOString().slice(0, 10)
    const productionYear = jalaliYear(ctx.now) - TEASER_VEHICLE_AGE_YEARS

    return Object.keys(VEHICLE_GROUP_FA).map((vehicleGroup) => ({
      vehicleUsage: 'PERSONAL',
      vehicleGroup,
      vehicleModelId: 'teaser',
      productionYear,
      plate: TEASER_PLATE,
      startDate,
      hasPreviousPolicy: false,
      bodilyDiscountYears: 0,
      propertyDiscountYears: 0,
      propertyCoverageTier: 'P_2_5',
    }))
  }

  /** Third-party cover is annual: a year from the start date, ending the day before it recurs. */
  coveragePeriod(input: MotorTplInput): { startsAt: Date; endsAt: Date } {
    const startsAt = new Date(`${input.startDate}T00:00:00Z`)
    const anniversary = Date.UTC(
      startsAt.getUTCFullYear() + 1,
      startsAt.getUTCMonth(),
      startsAt.getUTCDate(),
    )
    return { startsAt, endsAt: new Date(anniversary - 1000) }
  }

  /** Age at the moment cover starts, not today — a policy bought in Esfand ages in Farvardin. */
  private vehicleAgeYears(input: MotorTplInput): number {
    const starts = new Date(`${input.startDate}T00:00:00Z`)
    return Math.max(0, jalaliYear(starts) - input.productionYear)
  }

  private percentFa(rate: number): string {
    return `${toPersianNumber(Number((rate * 100).toFixed(1)))}٪`
  }

  /** The two limits the customer actually chose, then whatever the table grants on top. */
  private coverages(table: MotorTplRateTable, propertyLimit: Rial): CoverageItem[] {
    return [
      {
        key: 'bodily',
        labelFa: 'تعهد جانی (هر نفر)',
        valueFa: formatToman(table.diyeAmount),
        highlight: true,
      },
      {
        key: 'property',
        labelFa: 'تعهد مالی (هر حادثه)',
        valueFa: formatToman(propertyLimit),
        highlight: true,
      },
      ...table.coverages,
    ]
  }
}
