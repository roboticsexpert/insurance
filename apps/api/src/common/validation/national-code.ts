import { toLatinDigits } from '../fa'

/**
 * Iranian national code (کد ملی): 10 digits, mod-11 checksum.
 * Repdigit codes (0000000000, 1111111111 …) pass the checksum but are not real.
 */
export function isValidNationalCode(input: string): boolean {
  const code = toLatinDigits(input).replace(/\D/g, '')
  if (code.length !== 10) return false
  if (/^(\d)\1{9}$/.test(code)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(code[i]) * (10 - i)
  const remainder = sum % 11
  const check = Number(code[9])
  return remainder < 2 ? check === remainder : check === 11 - remainder
}

export const normalizeNationalCode = (input: string): string =>
  toLatinDigits(input).replace(/\D/g, '').padStart(10, '0')
