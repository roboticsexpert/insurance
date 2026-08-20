import { type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { PrismaClient } from '@prisma/client'
import cookieParser from 'cookie-parser'
import { AppModule } from '../../src/app.module'

export interface E2eContext {
  app: INestApplication
  db: PrismaClient
  /** The base path every route sits behind, mirroring main.ts. */
  api: string
}

/**
 * Boots the real AppModule with the same middleware and prefix main.ts applies, so an e2e test
 * exercises the app the deployed process actually runs — not a stripped-down stand-in.
 */
export async function createE2eApp(): Promise<E2eContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()

  const app = moduleRef.createNestApplication({ logger: false })
  app.use(cookieParser())
  // Kept identical to main.ts — the mock gateway's two routes sit outside the prefix because
  // a bank redirects to a bare path, and a test behind the prefix would not catch it drifting.
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready', 'mock-gateway', 'mock-gateway/settle'],
  })
  await app.init()

  const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
  await db.$connect()

  return { app, db, api: '/api/v1' }
}

/** Wipes every table between tests. Order matters only where cascades do not cover it. */
export async function resetDatabase(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SmsLog", "Policy", "Payment", "Order", "QuoteOffer", "Quote",
      "RefreshToken", "OtpChallenge", "InsuredPerson", "Vehicle", "User"
    RESTART IDENTITY CASCADE
  `)
}

/** Reads a cookie value out of a supertest response. */
export function cookieFrom(setCookie: string[] | string | undefined, name: string): string | null {
  const all = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []
  for (const raw of all) {
    const match = new RegExp(`${name}=([^;]*)`).exec(raw)
    // A cleared cookie is `name=` with an empty value — which is falsy, so this has to be an
    // explicit undefined check or "cookie was cleared" reads as "no cookie header at all".
    if (match?.[1] !== undefined) return match[1]
  }
  return null
}
