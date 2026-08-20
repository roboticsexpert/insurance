import { Injectable } from '@nestjs/common'
import type { Prisma, Vehicle, VehicleModel } from '@prisma/client'
import { AppException } from '../common/app.exception'
import { formatPlateFa, type Plate } from '../common/validation/plate'
import { PrismaService } from '../prisma/prisma.service'
import {
  VEHICLE_GROUP_FA,
  VEHICLE_USAGE_FA,
  type VehicleGroup,
  type VehicleUsage,
} from '../products/schemas/motor-tpl'
import type { SaveVehicleDto, VehicleDto } from './vehicles.dto'

/** Enough for a household; past this the list stops being a shortcut and becomes a search. */
export const MAX_SAVED_VEHICLES = 20

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<VehicleDto[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId },
      include: { vehicleModel: true },
      orderBy: { createdAt: 'desc' },
    })

    return vehicles.map(toDto)
  }

  /**
   * Saving the same plate twice updates the existing row rather than adding a second one. A
   * customer re-quoting the same car should not accumulate duplicates of it, and the plate is
   * what identifies a vehicle to its owner — not the row id.
   */
  async save(userId: string, dto: SaveVehicleDto): Promise<VehicleDto> {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: dto.vehicleModelId },
    })
    if (!model || !model.isActive) throw new AppException('NOT_FOUND')

    const existing = await this.findByPlate(userId, dto.plate)

    if (existing) {
      const updated = await this.prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          vehicleModelId: model.id,
          productionYear: dto.productionYear,
          usage: dto.usage,
          group: model.group,
        },
        include: { vehicleModel: true },
      })
      return toDto(updated)
    }

    const count = await this.prisma.vehicle.count({ where: { userId } })
    if (count >= MAX_SAVED_VEHICLES) {
      throw new AppException('VALIDATION_FAILED', {
        messageFa: 'به حداکثر تعداد خودروی ذخیره‌شده رسیده‌اید. یکی را حذف کنید.',
      })
    }

    const created = await this.prisma.vehicle.create({
      data: {
        userId,
        vehicleModelId: model.id,
        plate: dto.plate as unknown as Prisma.InputJsonValue,
        productionYear: dto.productionYear,
        usage: dto.usage,
        // Copied from the model rather than accepted from the client: the group is a rate
        // driver, and letting a caller assert it would let them pick their own price band.
        group: model.group,
      },
      include: { vehicleModel: true },
    })

    return toDto(created)
  }

  async remove(userId: string, id: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) throw new AppException('NOT_FOUND')
    if (vehicle.userId !== userId) throw new AppException('FORBIDDEN')

    await this.prisma.vehicle.delete({ where: { id } })
  }

  /**
   * `plate` is jsonb, so this cannot be a unique constraint the database enforces. Comparing
   * in memory is fine at 20 rows a user and keeps the match on the *canonical* four fields
   * rather than on JSON key order, which Postgres does not normalise for `jsonb` equality.
   */
  private async findByPlate(userId: string, plate: Plate): Promise<Vehicle | null> {
    const vehicles = await this.prisma.vehicle.findMany({ where: { userId } })
    return vehicles.find((v) => samePlate(v.plate as unknown as Plate, plate)) ?? null
  }
}

const samePlate = (a: Plate, b: Plate): boolean =>
  a?.twoDigit === b.twoDigit &&
  a?.letter === b.letter &&
  a?.threeDigit === b.threeDigit &&
  a?.iranCode === b.iranCode

function toDto(vehicle: Vehicle & { vehicleModel: VehicleModel }): VehicleDto {
  const plate = vehicle.plate as unknown as Plate
  const group = vehicle.group as VehicleGroup
  const usage = vehicle.usage as VehicleUsage

  return {
    id: vehicle.id,
    vehicleModelId: vehicle.vehicleModelId,
    modelLabelFa: `${vehicle.vehicleModel.brandFa} ${vehicle.vehicleModel.modelFa}`,
    brandFa: vehicle.vehicleModel.brandFa,
    group,
    groupFa: VEHICLE_GROUP_FA[group] ?? group,
    usage,
    usageFa: VEHICLE_USAGE_FA[usage] ?? usage,
    productionYear: vehicle.productionYear,
    plate,
    plateFa: formatPlateFa(plate),
    createdAt: vehicle.createdAt.toISOString(),
  }
}
