import { z } from 'zod'
// Side-effect import: installs the Persian zod error map. Every product schema reaches zod
// through this module, so importing it here is what guarantees the map is always in place.
import '../../common/zod-fa'
import { isValidNationalCode } from '../../common/validation/national-code'
import { isValidPlate, PLATE_LETTERS } from '../../common/validation/plate'

/**
 * Dates cross the wire as Gregorian ISO `YYYY-MM-DD`. Jalali exists only in the UI layer —
 * storing or transmitting Jalali strings is how date bugs get born.
 */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'تاریخ نامعتبر است' })
  /*
   * Round-trip, not `Date.parse`. V8 rolls an impossible date forward rather than rejecting it —
   * `2027-02-30` parses happily and becomes 2027-03-02. The quote then echoed the impossible
   * date back while the policy was issued from the rolled one, so the customer saw one start
   * date and was covered from another.
   */
  .refine(
    (v) => {
      // The NaN guard is not belt-and-braces: zod runs a `.refine` even when an earlier check on
      // the same string already failed, so this sees `'nope'` and `toISOString()` would throw.
      const date = new Date(`${v}T00:00:00Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v
    },
    { message: 'تاریخ نامعتبر است' },
  )

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
