/**
 * Runs in every Jest worker before the module under test is imported, so `loadEnv()` sees a
 * complete environment. Points at a **separate database** — e2e truncates tables between
 * tests, which must never be pointed at the dev data.
 */
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://bime247:bime247@localhost:5433/bime247_test?schema=public'
process.env.WEB_URL = 'http://localhost:5173'
process.env.API_URL = 'http://localhost:3000'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-000000000000000000'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-00000000000000000'
process.env.AUTH_MOCK_OTP = '1234'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.COOKIE_DOMAIN = ''
process.env.PAYMENT_GATEWAY = 'mock'
process.env.SMS_PROVIDER = 'console'
