import { envSchema, loadEnv, resetEnvCache } from './env'

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5433/db',
  WEB_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  CORS_ORIGINS: 'http://localhost:5173',
}

/** Production, with the mock-gateway guard already satisfied, so tests isolate one concern. */
const prodBase = { ...base, NODE_ENV: 'production', ALLOW_MOCK_PAYMENT_IN_PROD: 'true' }

const messages = (env: Record<string, string>): string[] => {
  const result = envSchema.safeParse(env)
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
}

describe('env', () => {
  beforeEach(() => resetEnvCache())

  it('parses a valid development environment and coerces PORT', () => {
    const env = loadEnv({ ...base, PORT: '3000' } as NodeJS.ProcessEnv)
    expect(env.PORT).toBe(3000)
    expect(env.NODE_ENV).toBe('development')
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173'])
  })

  it('splits CORS_ORIGINS on commas and trims', () => {
    const env = envSchema.parse({ ...base, CORS_ORIGINS: ' https://a.com , https://b.com ' })
    expect(env.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com'])
  })

  it('rejects short JWT secrets', () => {
    expect(messages({ ...base, JWT_ACCESS_SECRET: 'short' })).toEqual([
      'JWT_ACCESS_SECRET: JWT_ACCESS_SECRET must be at least 32 characters',
    ])
  })

  it('accepts the mock OTP outside production', () => {
    expect(messages({ ...base, AUTH_MOCK_OTP: '1234' })).toEqual([])
  })

  // The whole point of the two-flag design: one mistake must not be enough.
  it('refuses to boot in production with the mock OTP set', () => {
    const errors = messages({ ...prodBase, AUTH_MOCK_OTP: '1234' })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('AUTH_MOCK_OTP is set in production')
  })

  it('allows the mock OTP in production only when explicitly permitted', () => {
    const errors = messages({ ...prodBase, AUTH_MOCK_OTP: '1234', ALLOW_MOCK_AUTH_IN_PROD: 'true' })
    expect(errors).toEqual([])
  })

  /*
   * Same risk shape as the universal OTP: a mock gateway in production hands out policies to
   * anyone who can reach the bank page and click "successful payment".
   */
  it('refuses to boot in production with the mock payment gateway', () => {
    const errors = messages({ ...base, NODE_ENV: 'production', PAYMENT_GATEWAY: 'mock' })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('would issue policies without taking payment')
  })

  it('allows the mock gateway in production only when explicitly permitted', () => {
    expect(
      messages({
        ...base,
        NODE_ENV: 'production',
        PAYMENT_GATEWAY: 'mock',
        ALLOW_MOCK_PAYMENT_IN_PROD: 'true',
      }),
    ).toEqual([])
  })

  it('refuses to boot in production with example secrets or no CORS origins', () => {
    const errors = messages({
      ...prodBase,
      CORS_ORIGINS: '',
      JWT_ACCESS_SECRET: 'dev-access-secret-change-me-please-32-chars-min',
    })
    expect(errors).toEqual([
      'CORS_ORIGINS: CORS_ORIGINS must list the web origin explicitly in production.',
      'JWT_ACCESS_SECRET: JWT_ACCESS_SECRET still holds the example value.',
    ])
  })

  it('rejects a malformed mock OTP', () => {
    expect(messages({ ...base, AUTH_MOCK_OTP: '12' })).toEqual([
      'AUTH_MOCK_OTP: AUTH_MOCK_OTP must be 4 digits or empty',
    ])
  })
})
