import { toLatinDigits, toPersianDigits } from './fa'

/**
 * The letters that appear on Iranian civilian plates, in the order the picker shows them.
 *
 * Duplicated from the API rather than fetched: the alphabet on a licence plate is frozen by
 * regulation, and a select that cannot populate without a round-trip is a worse form. The API
 * stays the authority on whether a *submitted* plate is valid — this is only enough for
 * instant feedback, the same bargain `mobile.ts` makes.
 *
 * `تشریفات` is the diplomatic-protocol plate; `D` and `S` are the two Latin letters used on
 * diplomatic and service plates and are correct as Latin — they are not a transliteration slip.
 */
export const PLATE_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'د', 'س', 'ص', 'ط', 'ع', 'ق', 'ک', 'ل',
  'م', 'ن', 'و', 'ه', 'ی', 'ژ', 'تشریفات', 'D', 'S',
] as const

export interface Plate {
  /** The two digits on the left of the plate. */
  twoDigit: string
  letter: string
  /** The three digits to the right of the letter. */
  threeDigit: string
  /** The provincial code in the small «ایران» box. */
  iranCode: string
}

export const EMPTY_PLATE: Plate = { twoDigit: '', letter: '', threeDigit: '', iranCode: '' }

export const isValidPlate = (p: Plate): boolean =>
  /^\d{2}$/.test(toLatinDigits(p.twoDigit)) &&
  /^\d{3}$/.test(toLatinDigits(p.threeDigit)) &&
  /^\d{2}$/.test(toLatinDigits(p.iranCode)) &&
  (PLATE_LETTERS as readonly string[]).includes(p.letter)

/** `۱۲ ب ۳۴۵ ایران ۱۰` — how a plate is written in running text. */
export const formatPlateFa = (p: Plate): string =>
  `${toPersianDigits(p.twoDigit)} ${p.letter} ${toPersianDigits(p.threeDigit)} ایران ${toPersianDigits(p.iranCode)}`

/** Which part is still missing, for a hint that names the gap rather than just saying "invalid". */
export const plateHint = (p: Plate): string | undefined => {
  if (isValidPlate(p)) return undefined
  if (!p.twoDigit && !p.letter && !p.threeDigit && !p.iranCode) return undefined
  if (toLatinDigits(p.twoDigit).length < 2) return 'دو رقم سمت چپ را کامل کنید'
  if (!p.letter) return 'حرف پلاک را انتخاب کنید'
  if (toLatinDigits(p.threeDigit).length < 3) return 'سه رقم میانی را کامل کنید'
  return 'کد استان را کامل کنید'
}
