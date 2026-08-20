import { execSync } from 'node:child_process'
import { Client } from 'pg'

const TEST_DB = 'bime247_test'
const ADMIN_URL = 'postgresql://bime247:bime247@localhost:5433/bime247'
const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://bime247:bime247@localhost:5433/${TEST_DB}?schema=public`

/** Creates the test database if it is missing, then brings it up to the current schema. */
export default async function globalSetup(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL })
  await admin.connect()
  try {
    await admin.query(`CREATE DATABASE ${TEST_DB}`)
    console.log(`\n[e2e] created database ${TEST_DB}`)
  } catch (error) {
    // 42P04 = duplicate_database. Anything else is a real problem.
    if ((error as { code?: string }).code !== '42P04') throw error
  } finally {
    await admin.end()
  }

  execSync('npx prisma migrate deploy', {
    cwd: `${__dirname}/..`,
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: 'pipe',
  })

  /*
   * Catalog, insurers and rate tables are *reference* data, not fixtures: `resetDatabase`
   * deliberately leaves them standing between tests, so they are seeded once here. Anything
   * quoting a real product needs them, and hand-built stand-ins would drift from the rows the
   * rating strategies are actually tuned against. The seed upserts, so re-running is free.
   */
  execSync('npx tsx prisma/seed.ts', {
    cwd: `${__dirname}/..`,
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: 'pipe',
  })
}
