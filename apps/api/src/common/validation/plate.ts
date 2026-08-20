import { toLatinDigits, toPersianDigits } from '../fa'

/** The letters that appear on Iranian civilian plates. */
export const PLATE_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'د', 'س', 'ص', 'ط', 'ع', 'ق', 'ک', 'ل',
  'م', 'ن', 'و', 'ه', 'ی', 'ژ', 'تشریفات', 'D', 'S',
] as const
export type PlateLetter = (typeof PLATE_LETTERS)[number]

export interface Plate {
  /** Left two digits. */
  twoDigit: string
  letter: string
  /** Right three digits. */
  threeDigit: string
  /** The provincial code in the small right-hand box. */
  iranCode: string
}

export function isValidPlate(p: Plate): boolean {
  return (
    /^\d{2}$/.test(toLatinDigits(p.twoDigit)) &&
    /^\d{3}$/.test(toLatinDigits(p.threeDigit)) &&
    /^\d{2}$/.test(toLatinDigits(p.iranCode)) &&
    (PLATE_LETTERS as readonly string[]).includes(p.letter)
  )
}

/** `۱۲ ب ۳۴۵ ایران ۱۰` */
export function formatPlateFa(p: Plate): string {
  return `${toPersianDigits(p.twoDigit)} ${p.letter} ${toPersianDigits(p.threeDigit)} ایران ${toPersianDigits(p.iranCode)}`
}
