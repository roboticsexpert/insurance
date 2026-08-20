import { Injectable } from '@nestjs/common'
import { AppException } from '../common/app.exception'
import { normalizeFa, toPersianDigits } from '../common/fa'
import { PLATE_LETTERS } from '../common/validation/plate'
import { PrismaService } from '../prisma/prisma.service'
import { EXTRA_PERIL_FA, PROPERTY_TYPE_FA } from '../products/schemas/home-fire'
import {
  PROPERTY_TIER_PERCENT,
  VEHICLE_GROUP_FA,
  VEHICLE_USAGE_FA,
} from '../products/schemas/motor-tpl'
import { TRAVEL_COVERAGE_FA, TRAVEL_ZONE_FA } from '../products/schemas/travel'
import type { ReferenceItem, ReferenceKey } from './reference.dto'

/** Guards against a single request pulling an unbounded list into memory. */
const MAX_ITEMS = 500

/*
 * Persian alphabetical order is NOT Unicode code-point order: پ is U+067E but sorts after ب,
 * well before س at U+0633. Postgres orders by the database collation, which gets this wrong
 * unless the cluster was built with a Persian locale — so ordering happens here instead, where
 * it is correct regardless of how the database was provisioned.
 *
 * The `take` above still runs in the database, so this only reorders within the capped set.
 * That is fine while lists stay under MAX_ITEMS; past that the cap needs rethinking anyway.
 */
const faCollator = new Intl.Collator('fa', { numeric: true, sensitivity: 'base' })

const sortFa = (items: ReferenceItem[]): ReferenceItem[] =>
  [...items].sort(
    (a, b) =>
      faCollator.compare(a.groupFa ?? '', b.groupFa ?? '') ||
      faCollator.compare(a.labelFa, b.labelFa),
  )

const fromLabelMap = (map: Record<string, string>): ReferenceItem[] =>
  Object.entries(map).map(([value, labelFa]) => ({ value, labelFa }))

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(key: ReferenceKey, query?: string): Promise<ReferenceItem[]> {
    // Normalising the query fixes the ی/ي and ک/ك split that Arabic keyboards produce, which
    // otherwise makes "کرمان" typed on one keyboard fail to match the same word stored from
    // another.
    const q = query ? normalizeFa(query) : undefined

    switch (key) {
      case 'cities':
        return this.cities(q)
      case 'provinces':
        return this.provinces()
      case 'vehicle-models':
        return this.vehicleModels(q)
      case 'travel-zones':
        return fromLabelMap(TRAVEL_ZONE_FA)
      case 'travel-coverages':
        return fromLabelMap(TRAVEL_COVERAGE_FA)
      case 'vehicle-usages':
        return fromLabelMap(VEHICLE_USAGE_FA)
      case 'vehicle-groups':
        return fromLabelMap(VEHICLE_GROUP_FA)
      case 'property-types':
        return fromLabelMap(PROPERTY_TYPE_FA)
      case 'extra-perils':
        return fromLabelMap(EXTRA_PERIL_FA)
      case 'property-tiers':
        return this.propertyTiers()
      case 'plate-letters':
        return PLATE_LETTERS.map((letter) => ({ value: letter, labelFa: letter }))
      default:
        throw new AppException('NOT_FOUND')
    }
  }

  private async cities(q?: string): Promise<ReferenceItem[]> {
    const cities = await this.prisma.city.findMany({
      where: q ? { nameFa: { contains: q } } : undefined,
      orderBy: [{ provinceFa: 'asc' }, { nameFa: 'asc' }],
      take: MAX_ITEMS,
    })

    return sortFa(
      cities.map((city) => ({
        value: city.id,
        labelFa: city.nameFa,
        groupFa: city.provinceFa,
        // The earthquake add-on is priced off this, so the form carries it along.
        meta: { quakeZone: city.quakeZone },
      })),
    )
  }

  private async provinces(): Promise<ReferenceItem[]> {
    const rows = await this.prisma.city.findMany({
      distinct: ['provinceFa'],
      select: { provinceFa: true },
      orderBy: { provinceFa: 'asc' },
    })
    return sortFa(rows.map((row) => ({ value: row.provinceFa, labelFa: row.provinceFa })))
  }

  private async vehicleModels(q?: string): Promise<ReferenceItem[]> {
    const models = await this.prisma.vehicleModel.findMany({
      where: {
        isActive: true,
        ...(q ? { OR: [{ brandFa: { contains: q } }, { modelFa: { contains: q } }] } : {}),
      },
      orderBy: [{ brandFa: 'asc' }, { modelFa: 'asc' }],
      take: MAX_ITEMS,
    })

    return sortFa(
      models.map((model) => ({
        value: model.id,
        labelFa: `${model.brandFa} ${model.modelFa}`,
        groupFa: model.brandFa,
        meta: { group: model.group },
      })),
    )
  }

  private propertyTiers(): ReferenceItem[] {
    return Object.entries(PROPERTY_TIER_PERCENT).map(([value, percent]) => ({
      value,
      // ٫ is the Persian decimal separator; 2.5 must never surface as "2.5".
      labelFa: `${toPersianDigits(String(percent).replace('.', '٫'))} درصد تعهد جانی`,
      meta: { percent },
    }))
  }
}
