import { z } from 'zod'
import { toLatinDigits } from '../../common/fa'
import { isValidMobile, normalizeMobile } from '../../common/validation/mobile'
import type { UserDto } from '../../users/user.dto'

/** Accepts whatever the user types and hands the service the canonical `9XXXXXXXXX`. */
const mobileField = z
  .string()
  .refine(isValidMobile, { message: 'شماره موبایل معتبر نیست' })
  .transform((value) => normalizeMobile(value) as string)

export const otpRequestSchema = z.object({ mobile: mobileField })
export type OtpRequestDto = z.infer<typeof otpRequestSchema>

export interface OtpRequestResponse {
  /** Seconds until the code stops working. */
  expiresIn: number
  /** Seconds the client must wait before offering "resend". */
  retryAfter: number
  /** Never present in production — see `OtpService.request`. */
  devCode?: string
}

export const otpVerifySchema = z.object({
  mobile: mobileField,
  code: z
    .string()
    .transform((v) => toLatinDigits(v).replace(/\D/g, ''))
    .refine((v) => /^\d{4}$/.test(v), { message: 'کد ۴ رقمی است' }),
})
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>

export interface AuthResponse {
  accessToken: string
  user: UserDto
  /** True on the very first login, so the client can route straight to profile completion. */
  isNewUser: boolean
}

