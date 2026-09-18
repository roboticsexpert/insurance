import { z, ZodIssueCode, ZodParsedType, type ZodErrorMap } from 'zod'

/**
 * Persian defaults for every zod message the API can emit.
 *
 * `errors.ts` states that the API owns every Persian string the customer reads, and all three
 * wizards render `Object.values(error.fields)` verbatim — but a field only spoke Persian if
 * somebody remembered to give it a `message`. Everything else fell through to zod's English:
 * «Number must be less than or equal to 2000», «Invalid enum value. Expected 'APARTMENT' |
 * 'VILLA'…», «Required». Those reached the screen exactly as written.
 *
 * A global error map fixes it by construction rather than by vigilance: a field added tomorrow
 * with no `message` is still Persian. Per-field messages still win — this is only the floor.
 *
 * Installed on import rather than at bootstrap, and imported by `schemas/common.ts`, which every
 * product schema already imports. That is what makes it impossible to parse a product schema
 * without the map being in place — including from a unit test, a seed script, or a CLI, none of
 * which run `main.ts`.
 */

const TYPE_FA: Partial<Record<ZodParsedType, string>> = {
  string: 'متن',
  number: 'عدد',
  boolean: 'بله یا خیر',
  array: 'فهرست',
  object: 'شیء',
  date: 'تاریخ',
}

const persianErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      // zod reports a missing field as `received: undefined` — the English is «Required».
      return {
        message:
          issue.received === ZodParsedType.undefined || issue.received === ZodParsedType.null
            ? 'این فیلد الزامی است'
            : `مقدار باید ${TYPE_FA[issue.expected] ?? 'معتبر'} باشد`,
      }

    case ZodIssueCode.invalid_enum_value:
    case ZodIssueCode.invalid_literal:
    case ZodIssueCode.invalid_union:
      // The list of accepted values is not the customer's problem; the screen offers them.
      return { message: 'مقدار انتخاب‌شده معتبر نیست' }

    case ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `حداقل ${toFa(issue.minimum)} کاراکتر` }
      }
      if (issue.type === 'array') {
        return { message: `حداقل ${toFa(issue.minimum)} مورد` }
      }
      return {
        message: issue.inclusive
          ? `مقدار نمی‌تواند کمتر از ${toFa(issue.minimum)} باشد`
          : `مقدار باید بیشتر از ${toFa(issue.minimum)} باشد`,
      }

    case ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `حداکثر ${toFa(issue.maximum)} کاراکتر` }
      }
      if (issue.type === 'array') {
        return { message: `حداکثر ${toFa(issue.maximum)} مورد` }
      }
      return {
        message: issue.inclusive
          ? `مقدار نمی‌تواند بیشتر از ${toFa(issue.maximum)} باشد`
          : `مقدار باید کمتر از ${toFa(issue.maximum)} باشد`,
      }

    case ZodIssueCode.not_multiple_of:
      return { message: `مقدار باید مضربی از ${toFa(issue.multipleOf)} باشد` }

    case ZodIssueCode.invalid_string:
      return { message: issue.validation === 'uuid' ? 'شناسه معتبر نیست' : 'قالب مقدار درست نیست' }

    case ZodIssueCode.unrecognized_keys:
      return { message: 'فیلد ناشناخته ارسال شده است' }

    default:
      // `custom` (every `.refine`) already carries its own Persian message; this is the floor
      // under anything that somehow does not, and under codes zod adds later.
      return { message: ctx.defaultError === 'Invalid input' ? 'مقدار معتبر نیست' : ctx.defaultError }
  }
}

/** Numbers inside a message are read by the same person reading the message. */
function toFa(value: number | bigint): string {
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] as string)
}

z.setErrorMap(persianErrorMap)

export { persianErrorMap }
