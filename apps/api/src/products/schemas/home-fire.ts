import { z } from 'zod'
import { isoDate } from './common'

export const PropertyType = {
  APARTMENT: 'APARTMENT',
  VILLA: 'VILLA',
} as const
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType]

export const PROPERTY_TYPE_FA: Record<PropertyType, string> = {
  APARTMENT: 'آپارتمان',
  VILLA: 'ویلایی',
}

/** Add-on perils. Fire/lightning/explosion are always included and are not listed here. */
export const ExtraPeril = {
  EARTHQUAKE: 'EARTHQUAKE',
  FLOOD: 'FLOOD',
  THEFT: 'THEFT',
  WATER_DAMAGE: 'WATER_DAMAGE',
} as const
export type ExtraPeril = (typeof ExtraPeril)[keyof typeof ExtraPeril]

export const EXTRA_PERIL_FA: Record<ExtraPeril, string> = {
  EARTHQUAKE: 'زلزله',
  FLOOD: 'سیل و طغیان آب',
  THEFT: 'سرقت با شکست حرز',
  WATER_DAMAGE: 'ترکیدگی لوله آب',
}

export const homeFireInputSchema = z.object({
  propertyType: z.nativeEnum(PropertyType),
  cityId: z.string().min(1, { message: 'شهر را انتخاب کنید' }),
  areaSqm: z.number().int().min(20, { message: 'حداقل ۲۰ متر' }).max(2000),
  /** Rebuild cost of the structure, in Rial. */
  buildingValue: z.number().int().min(0),
  /** Value of belongings, in Rial. */
  contentsValue: z.number().int().min(0),
  extraPerils: z.array(z.nativeEnum(ExtraPeril)).default([]),
  durationMonths: z.literal(12),
  startDate: isoDate,
})
  .refine((v) => v.buildingValue + v.contentsValue > 0, {
    message: 'حداقل یکی از ارزش ساختمان یا اثاثیه باید بیشتر از صفر باشد',
    path: ['buildingValue'],
  })

export type HomeFireInput = z.infer<typeof homeFireInputSchema>
