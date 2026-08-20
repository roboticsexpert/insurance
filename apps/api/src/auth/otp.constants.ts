/** 4 digits to match what Iranian users expect from an SMS code. */
export const OTP_LENGTH = 4

export const OTP_TTL_SECONDS = 120
export const OTP_RESEND_SECONDS = 60

/** Ceilings per rolling hour. The per-mobile one protects the user's SMS bill and inbox. */
export const OTP_MAX_PER_HOUR_PER_MOBILE = 5
export const OTP_MAX_PER_HOUR_PER_IP = 20

/** Wrong guesses allowed before the challenge is burned. */
export const OTP_MAX_ATTEMPTS = 5

/**
 * OWASP's argon2id baseline. A 4-digit code has only 10,000 possibilities, so hashing cannot
 * make an offline attack impossible — it makes it slow, and keeps a leaked table from handing
 * over live codes for free.
 */
export const ARGON2_OPTIONS = {
  type: 2, // argon2id
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const
