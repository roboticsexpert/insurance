import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { RatingLookups } from './rating-strategy'

/**
 * The database side of `RatingLookups`.
 *
 * Its own provider rather than a private field on `RatingService`, because two callers need it
 * now: rating resolves price drivers before pricing, and issuance resolves the names that go on
 * the policy. Strategies still never import Prisma — this class is the whole of their access to
 * stored data, and keeping it in one place is what makes that boundary checkable.
 */
@Injectable()
export class PrismaRatingLookups implements RatingLookups {
  constructor(private readonly prisma: PrismaService) {}

  async cityQuakeZone(cityId: string): Promise<number | null> {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { quakeZone: true },
    })
    return city?.quakeZone ?? null
  }

  cityQuakeZones(): Promise<{ id: string; quakeZone: number }[]> {
    return this.prisma.city.findMany({ select: { id: true, quakeZone: true } })
  }

  async cityName(cityId: string): Promise<string | null> {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { provinceFa: true, nameFa: true },
    })
    if (!city) return null
    // A province is worth printing: several provinces have a شهرستان of the same name.
    return city.provinceFa === city.nameFa ? city.nameFa : `${city.provinceFa} / ${city.nameFa}`
  }

  async vehicleModelGroup(vehicleModelId: string): Promise<string | null> {
    const model = await this.prisma.vehicleModel.findFirst({
      where: { id: vehicleModelId, isActive: true },
      select: { group: true },
    })
    return model?.group ?? null
  }

  vehicleModelGroups(): Promise<{ id: string; group: string }[]> {
    return this.prisma.vehicleModel.findMany({
      where: { isActive: true },
      select: { id: true, group: true },
    })
  }

  async vehicleModelName(vehicleModelId: string): Promise<string | null> {
    /*
     * Not filtered on `isActive`. A model withdrawn from the catalog after a policy was issued
     * must still print on that policy — the alternative is a document that forgets what it
     * covers because the catalog moved on.
     */
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: vehicleModelId },
      select: { brandFa: true, modelFa: true },
    })
    return model ? `${model.brandFa} ${model.modelFa}` : null
  }
}
