import { z } from 'zod'
import { isValidNationalCode, normalizeNationalCode } from '../../common/validation/national-code'
import { toLatinDigits } from '../../common/fa'

const MAX_AGE_YEARS = 120

const name = z
  .string()
  .trim()
  .min(2, { message: 'حداقل ۲ حرف' })
  .max(50, { message: 'حداکثر ۵۰ حرف' })

export const updateProfileSchema = z.object({
  firstName: name,
  lastName: name,
  nationalCode: z
    .string()
    .transform((v) => normalizeNationalCode(toLatinDigits(v)))
    .refine(isValidNationalCode, { message: 'کد ملی معتبر نیست' }),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'تاریخ تولد معتبر نیست' })
    .refine((v) => {
      const date = Date.parse(v)
      if (Number.isNaN(date)) return false
      const age = (Date.now() - date) / (365.25 * 86_400_000)
      return age > 0 && age < MAX_AGE_YEARS
    }, { message: 'تاریخ تولد معتبر نیست' }),
  email: z
    .string()
    .trim()
    .email({ message: 'ایمیل معتبر نیست' })
    .optional()
    .nullable(),
})

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
