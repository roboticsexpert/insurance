import { PrismaClient, type Prisma } from '@prisma/client'
import { RatingRegistry } from '../src/rating/rating.registry'
import { RatingService } from '../src/rating/rating.service'
import { HomeFireRatingStrategy } from '../src/rating/strategies/home-fire.strategy'
import { MotorTplRatingStrategy } from '../src/rating/strategies/motor-tpl.strategy'
import { TravelRatingStrategy } from '../src/rating/strategies/travel.strategy'
import { CITIES } from './seed-data/cities'
import { INSURERS } from './seed-data/insurers'
import { HOME_FIRE_RATE_TABLES } from './seed-data/home-fire-rates'
import { MOTOR_TPL_RATE_TABLES } from './seed-data/motor-tpl-rates'
import { PRODUCTS } from './seed-data/products'
import { TRAVEL_RATE_TABLES } from './seed-data/travel-rates'
import { VEHICLE_MODELS } from './seed-data/vehicle-models'

/*
 * Seeds reference and catalog data. Safe to run repeatedly: every write is an upsert keyed on
 * a natural unique constraint, so re-running updates rows rather than duplicating them.
 *
 * Note this talks to PrismaClient directly rather than booting a Nest context — `tsx` uses
 * esbuild, which does not implement `emitDecoratorMetadata`, so Nest's DI cannot resolve here.
 * For the same reason there is no top-level await: `apps/api` is CommonJS.
 */

const db = new PrismaClient()

/** The rate-table version this seed writes. Bump to publish a new set of rates. */
const RATE_TABLE_VERSION = 1

async function seedInsurers(): Promise<Map<string, string>> {
  const ids = new Map<string, string>()

  for (const insurer of INSURERS) {
    const row = await db.insurer.upsert({
      where: { slug: insurer.slug },
      create: { ...insurer, isActive: true },
      update: {
        name: insurer.name,
        solvencyLevel: insurer.solvencyLevel,
        claimSatisfaction: insurer.claimSatisfaction,
        branchCount: insurer.branchCount,
        sortWeight: insurer.sortWeight,
        isActive: true,
      },
    })
    ids.set(insurer.slug, row.id)
  }

  return ids
}

async function seedProducts(insurerIds: Map<string, string>): Promise<Map<string, string>> {
  const ids = new Map<string, string>()

  for (const product of PRODUCTS) {
    const { insurerSlugs, faq, ...fields } = product
    const row = await db.product.upsert({
      where: { slug: product.slug },
      // fromAmount is deliberately left alone: it is derived from the rate tables by the
      // rating engine, not authored here, and must never be an invented number.
      create: { ...fields, faq: faq as unknown as Prisma.InputJsonValue, isActive: true },
      update: { ...fields, faq: faq as unknown as Prisma.InputJsonValue, isActive: true },
    })
    ids.set(product.slug, row.id)

    for (const slug of insurerSlugs) {
      const insurerId = insurerIds.get(slug)
      if (!insurerId) throw new Error(`Product ${product.slug} references unknown insurer ${slug}`)

      await db.offering.upsert({
        where: { productId_insurerId: { productId: row.id, insurerId } },
        create: { productId: row.id, insurerId, isActive: true },
        update: { isActive: true },
      })
    }
  }

  return ids
}

/**
 * One product's rate tables, one row per insurer that sells it. Generic over the product
 * because every table lands in the same `RateTable.data` jsonb — the *shape* of that blob is
 * the rating strategy's business, not the seed's.
 */
async function seedRateTables(
  productSlug: string,
  entries: readonly { insurerSlug: string; featuresFa: string[]; table: unknown }[],
  productIds: Map<string, string>,
  insurerIds: Map<string, string>,
): Promise<number> {
  const productId = productIds.get(productSlug)
  if (!productId) throw new Error(`${productSlug} product missing`)

  let written = 0

  for (const entry of entries) {
    const insurerId = insurerIds.get(entry.insurerSlug)
    if (!insurerId) throw new Error(`Rate table references unknown insurer ${entry.insurerSlug}`)

    /*
     * `update`, not `upsert`: who sells a product is decided by `products.ts`, and a rate table
     * for an insurer with no offering means the two files disagree. Saying so beats Prisma's
     * "No record was found for an update", which names neither the product nor the insurer.
     */
    const offering = await db.offering
      .update({
        where: { productId_insurerId: { productId, insurerId } },
        data: { featuresFa: entry.featuresFa },
      })
      .catch(() => {
        throw new Error(
          `No offering for ${productSlug} × ${entry.insurerSlug}. ` +
            `Add the insurer to that product's insurerSlugs in products.ts, or drop its rate table.`,
        )
      })

    await db.rateTable.upsert({
      where: { offeringId_version: { offeringId: offering.id, version: RATE_TABLE_VERSION } },
      create: {
        offeringId: offering.id,
        version: RATE_TABLE_VERSION,
        data: entry.table as unknown as Prisma.InputJsonValue,
        note: 'Seeded placeholder rates',
      },
      update: {
        data: entry.table as unknown as Prisma.InputJsonValue,
        note: 'Seeded placeholder rates',
      },
    })
    written++
  }

  return written
}

async function seedCities(): Promise<number> {
  for (const city of CITIES) {
    await db.city.upsert({
      where: { provinceFa_nameFa: { provinceFa: city.provinceFa, nameFa: city.nameFa } },
      create: city,
      update: { quakeZone: city.quakeZone },
    })
  }
  return CITIES.length
}

async function seedVehicleModels(): Promise<number> {
  for (const model of VEHICLE_MODELS) {
    await db.vehicleModel.upsert({
      where: { brandFa_modelFa: { brandFa: model.brandFa, modelFa: model.modelFa } },
      create: { ...model, isActive: true },
      update: { group: model.group, isActive: true },
    })
  }
  return VEHICLE_MODELS.length
}

async function main(): Promise<void> {
  console.log('seeding…')

  const insurerIds = await seedInsurers()
  console.log(`  insurers        ${insurerIds.size}`)

  const productIds = await seedProducts(insurerIds)
  console.log(`  products        ${productIds.size}`)

  const travelRates = await seedRateTables('travel', TRAVEL_RATE_TABLES, productIds, insurerIds)
  console.log(`  travel rates    ${travelRates} (version ${RATE_TABLE_VERSION}, PLACEHOLDER)`)

  const motorRates = await seedRateTables('motor-tpl', MOTOR_TPL_RATE_TABLES, productIds, insurerIds)
  console.log(`  motor rates     ${motorRates} (version ${RATE_TABLE_VERSION}, PLACEHOLDER)`)

  const fireRates = await seedRateTables('home-fire', HOME_FIRE_RATE_TABLES, productIds, insurerIds)
  console.log(`  home fire rates ${fireRates} (version ${RATE_TABLE_VERSION}, PLACEHOLDER)`)

  console.log(`  cities          ${await seedCities()}`)
  console.log(`  vehicle models  ${await seedVehicleModels()}`)

  // The «از … تومان» teaser is derived from the tables just written, never authored. Nest DI
  // cannot run under tsx, so the service is constructed by hand — it takes plain constructor
  // arguments precisely so this is possible.
  const rating = new RatingService(
    db as never,
    new RatingRegistry([
      new TravelRatingStrategy(),
      new MotorTplRatingStrategy(),
      new HomeFireRatingStrategy(),
    ]),
  )
  const teasers = await rating.refreshTeaserPrices()
  for (const { slug, fromAmount, isSample } of teasers) {
    const shown =
      fromAmount === null
        ? 'null (no priceable rates yet)'
        : `${(fromAmount / 10).toLocaleString('fa-IR')} تومان${isSample ? ' (نمونه)' : ''}`
    console.log(`  teaser ${slug.padEnd(10)} ${shown}`)
  }

  console.log('\ndone. All rates are placeholders — the UI must show the «نمونه» badge.')
}

main()
  .catch((error: unknown) => {
    console.error('seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => void db.$disconnect())
