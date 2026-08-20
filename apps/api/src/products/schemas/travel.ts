import { z } from 'zod'
import { isoDate } from './common'

export const TravelZone = {
  SCHENGEN: 'SCHENGEN',
  ASIA: 'ASIA',
  AMERICAS: 'AMERICAS',
  WORLDWIDE: 'WORLDWIDE',
  HAJJ_OMRAH: 'HAJJ_OMRAH',
} as const
export type TravelZone = (typeof TravelZone)[keyof typeof TravelZone]

export const TRAVEL_ZONE_FA: Record<TravelZone, string> = {
  SCHENGEN: 'اروپا (شنگن)',
  ASIA: 'آسیا',
  AMERICAS: 'آمریکا و کانادا',
  WORLDWIDE: 'سراسر جهان',
  HAJJ_OMRAH: 'حج و عمره',
}

export const TravelCoverage = {
  EUR_15K: 'EUR_15K',
  EUR_30K: 'EUR_30K',
  EUR_50K: 'EUR_50K',
  EUR_100K: 'EUR_100K',
} as const
export type TravelCoverage = (typeof TravelCoverage)[keyof typeof TravelCoverage]

export const TRAVEL_COVERAGE_FA: Record<TravelCoverage, string> = {
  EUR_15K: '۱۵ هزار یورو',
  EUR_30K: '۳۰ هزار یورو',
  EUR_50K: '۵۰ هزار یورو',
  EUR_100K: '۱۰۰ هزار یورو',
}

export const travelInputSchema = z
  .object({
    destinationZone: z.nativeEnum(TravelZone),
    startDate: isoDate,
    endDate: isoDate,
    coverageLimit: z.nativeEnum(TravelCoverage),
    /*
     * Quoting needs **age and nothing else**. Names, national codes and passport numbers are
     * required to *issue* a policy, not to price one — asking for them before showing a price
     * is how a funnel dies. They are collected at checkout, on the order.
     */
    travelers: z
      .array(z.object({ birthDate: isoDate }))
      .min(1, { message: 'حداقل یک مسافر' })
      .max(10, { message: 'حداکثر ۱۰ مسافر در هر استعلام' }),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: 'تاریخ بازگشت باید بعد از تاریخ رفت باشد',
    path: ['endDate'],
  })
  .refine(
    (v) => (Date.parse(v.endDate) - Date.parse(v.startDate)) / 86_400_000 <= 365,
    { message: 'حداکثر مدت سفر یک سال است', path: ['endDate'] },
  )

export type TravelInput = z.infer<typeof travelInputSchema>

/** Inclusive day count — the rate driver. A 1-day trip is 1 day, not 0. */
export const travelDurationDays = (input: Pick<TravelInput, 'startDate' | 'endDate'>): number =>
  Math.max(1, Math.round((Date.parse(input.endDate) - Date.parse(input.startDate)) / 86_400_000))
