import { z } from 'zod'
import { isoDate, plateSchema } from './common'

export const VehicleUsage = {
  PERSONAL: 'PERSONAL',
  COMMERCIAL: 'COMMERCIAL',
  TAXI: 'TAXI',
} as const
export type VehicleUsage = (typeof VehicleUsage)[keyof typeof VehicleUsage]

export const VEHICLE_USAGE_FA: Record<VehicleUsage, string> = {
  PERSONAL: 'شخصی',
  COMMERCIAL: 'باربری / تجاری',
  TAXI: 'تاکسی و مسافربری',
}

export const VehicleGroup = {
  SEDAN: 'SEDAN',
  PICKUP: 'PICKUP',
  VAN: 'VAN',
  TRUCK: 'TRUCK',
  MOTORCYCLE: 'MOTORCYCLE',
} as const
export type VehicleGroup = (typeof VehicleGroup)[keyof typeof VehicleGroup]

export const VEHICLE_GROUP_FA: Record<VehicleGroup, string> = {
  SEDAN: 'سواری',
  PICKUP: 'وانت',
  VAN: 'ون / مینی‌بوس',
  TRUCK: 'کامیون',
  MOTORCYCLE: 'موتورسیکلت',
}

/**
 * تعهد مالی — the property-damage limit, set as a percentage of the bodily-injury limit
 * (دیه). The regulator defines the ladder; the customer picks a rung.
 */
export const PropertyTier = {
  P_2_5: 'P_2_5',
  P_4: 'P_4',
  P_5_5: 'P_5_5',
  P_7: 'P_7',
  P_8: 'P_8',
} as const
export type PropertyTier = (typeof PropertyTier)[keyof typeof PropertyTier]

export const PROPERTY_TIER_PERCENT: Record<PropertyTier, number> = {
  P_2_5: 2.5,
  P_4: 4,
  P_5_5: 5.5,
  P_7: 7,
  P_8: 8,
}

/** Statutory no-claims ladder: 0–14 years bodily, 0–8 years property. */
export const MAX_BODILY_DISCOUNT_YEARS = 14
export const MAX_PROPERTY_DISCOUNT_YEARS = 8

export const motorTplInputSchema = z
  .object({
    vehicleUsage: z.nativeEnum(VehicleUsage),
    vehicleGroup: z.nativeEnum(VehicleGroup),
    vehicleModelId: z.string().min(1, { message: 'خودرو را انتخاب کنید' }),
    productionYear: z
      .number()
      .int()
      .min(1350, { message: 'سال ساخت نامعتبر' })
      .max(1420, { message: 'سال ساخت نامعتبر' }),
    plate: plateSchema,
    startDate: isoDate,
    hasPreviousPolicy: z.boolean(),
    bodilyDiscountYears: z.number().int().min(0).max(MAX_BODILY_DISCOUNT_YEARS),
    propertyDiscountYears: z.number().int().min(0).max(MAX_PROPERTY_DISCOUNT_YEARS),
    propertyCoverageTier: z.nativeEnum(PropertyTier),
  })
  .refine((v) => v.hasPreviousPolicy || (v.bodilyDiscountYears === 0 && v.propertyDiscountYears === 0), {
    message: 'بدون بیمه‌نامه قبلی، تخفیف عدم خسارت وجود ندارد',
    path: ['bodilyDiscountYears'],
  })
  .refine((v) => v.vehicleGroup !== 'MOTORCYCLE' || v.vehicleUsage === 'PERSONAL', {
    message: 'برای موتورسیکلت فقط کاربری شخصی پشتیبانی می‌شود',
    path: ['vehicleUsage'],
  })

export type MotorTplInput = z.infer<typeof motorTplInputSchema>
