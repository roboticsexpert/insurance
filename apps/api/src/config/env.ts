import { z } from 'zod'

const boolFromString = z.enum(['true', 'false']).default('false').transform((v) => v === 'true')

const csv = z
  .string()
  .default('')
  .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    WEB_URL: z.string().url(),
    API_URL: z.string().url(),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

    /** Universal OTP for the MVP. Empty string disables it. */
    AUTH_MOCK_OTP: z
      .string()
      .default('')
      .refine((v) => v === '' || /^\d{4}$/.test(v), 'AUTH_MOCK_OTP must be 4 digits or empty'),
    ALLOW_MOCK_AUTH_IN_PROD: boolFromString,
    /** Same two-mistakes rule as the OTP: a mock gateway in production is free policies. */
    ALLOW_MOCK_PAYMENT_IN_PROD: boolFromString,

    PAYMENT_GATEWAY: z.enum(['mock']).default('mock'),
    SMS_PROVIDER: z.enum(['console']).default('console'),

    CORS_ORIGINS: csv,
    /** `.bimegold.com` in production, so app and api share the refresh cookie. */
    COOKIE_DOMAIN: z.string().default(''),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return

    // A universal OTP left on in production is total account takeover. Turning it on there
    // must take two deliberate mistakes, not one.
    if (env.AUTH_MOCK_OTP !== '' && !env.ALLOW_MOCK_AUTH_IN_PROD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_MOCK_OTP'],
        message:
          'AUTH_MOCK_OTP is set in production. Unset it, or set ALLOW_MOCK_AUTH_IN_PROD=true if this is genuinely intended.',
      })
    }
    // A mock gateway in production means anyone who reaches the bank page can click
    // "successful payment" and be issued a policy without paying.
    if (env.PAYMENT_GATEWAY === 'mock' && !env.ALLOW_MOCK_PAYMENT_IN_PROD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['PAYMENT_GATEWAY'],
        message:
          'PAYMENT_GATEWAY=mock in production would issue policies without taking payment. Use a real gateway, or set ALLOW_MOCK_PAYMENT_IN_PROD=true if this is a deliberate demo deployment.',
      })
    }
    if (env.CORS_ORIGINS.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list the web origin explicitly in production.',
      })
    }
    for (const secret of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (env[secret].includes('change-me')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [secret],
          message: `${secret} still holds the example value.`,
        })
      }
    }
  })

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

/**
 * Parses and validates `process.env` once. Throws a readable, multi-line error and takes the
 * process down rather than booting half-configured — a missing secret should never be a
 * runtime surprise three hours later.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached

  const result = envSchema.safeParse(source)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`)
  }

  cached = result.data
  return cached
}

/** Test-only. Production code has no reason to reload configuration. */
export function resetEnvCache(): void {
  cached = null
}
