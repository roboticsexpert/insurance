import { z } from 'zod'
import { isValidNationalCode } from '../../common/validation/national-code'
import { isValidPlate, PLATE_LETTERS } from '../../common/validation/plate'

/**
 * Dates cross the wire as Gregorian ISO `YYYY-MM-DD`. Jalali exists only in the UI layer —
 * storing or transmitting Jalali strings is how date bugs get born.
 */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'تاریخ نامعتبر است' })
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'تاریخ نامعتبر است' })

export const nationalCode = z
  .string()
  .refine(isValidNationalCode, { message: 'کد ملی معتبر نیست' })

export const personName = z
  .string()
  .min(2, { message: 'حداقل ۲ حرف' })
  .max(50, { message: 'حداکثر ۵۰ حرف' })

export const plateSchema = z
  .object({
    twoDigit: z.string().regex(/^\d{2}$/, { message: 'دو رقم سمت چپ' }),
    letter: z.enum(PLATE_LETTERS as unknown as [string, ...string[]]),
    threeDigit: z.string().regex(/^\d{3}$/, { message: 'سه رقم سمت راست' }),
    iranCode: z.string().regex(/^\d{2}$/, { message: 'کد شهر' }),
  })
  .refine(isValidPlate, { message: 'شماره پلاک معتبر نیست' })

export const insuredPersonSchema = z.object({
  firstName: personName,
  lastName: personName,
  nationalCode,
  birthDate: isoDate,
  passportNo: z.string().min(5).max(15).optional(),
})
export type InsuredPersonInput = z.infer<typeof insuredPersonSchema>
