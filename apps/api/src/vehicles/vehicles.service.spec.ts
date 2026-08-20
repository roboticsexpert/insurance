import { Test } from '@nestjs/testing'
import { AppException } from '../common/app.exception'
import { PrismaService } from '../prisma/prisma.service'
import { MAX_SAVED_VEHICLES, VehiclesService } from './vehicles.service'
import type { SaveVehicleDto } from './vehicles.dto'

const NOW = new Date('2026-08-20T10:00:00Z')
const PLATE = { twoDigit: '44', letter: 'ص', threeDigit: '821', iranCode: '11' }

const model = (over = {}) => ({
  id: 'vm1',
  brandFa: 'سایپا',
  modelFa: 'پراید ۱۳۱',
  group: 'SEDAN',
  isActive: true,
  ...over,
})

const vehicleRow = (over = {}) => ({
  id: 'v1',
  userId: 'u1',
  vehicleModelId: 'vm1',
  plate: PLATE,
  productionYear: 1400,
  usage: 'PERSONAL',
  group: 'SEDAN',
  createdAt: NOW,
  vehicleModel: model(),
  ...over,
})

const dto = (over: Partial<SaveVehicleDto> = {}): SaveVehicleDto => ({
  vehicleModelId: 'vm1',
  plate: PLATE,
  productionYear: 1400,
  usage: 'PERSONAL',
  ...over,
})

describe('VehiclesService', () => {
  const modelFindUnique = jest.fn()
  const vehicleFindMany = jest.fn()
  const vehicleFindUnique = jest.fn()
  const vehicleCreate = jest.fn()
  const vehicleUpdate = jest.fn()
  const vehicleDelete = jest.fn()
  const vehicleCount = jest.fn()
  let service: VehiclesService

  beforeEach(async () => {
    jest.clearAllMocks()
    modelFindUnique.mockResolvedValue(model())
    vehicleFindMany.mockResolvedValue([])
    vehicleCount.mockResolvedValue(0)
    vehicleCreate.mockResolvedValue(vehicleRow())
    vehicleUpdate.mockResolvedValue(vehicleRow())

    const moduleRef = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: {
            vehicleModel: { findUnique: modelFindUnique },
            vehicle: {
              findMany: vehicleFindMany,
              findUnique: vehicleFindUnique,
              create: vehicleCreate,
              update: vehicleUpdate,
              delete: vehicleDelete,
              count: vehicleCount,
            },
          },
        },
      ],
    }).compile()

    service = moduleRef.get(VehiclesService)
  })

  describe('save', () => {
    it('takes the group from the catalog, never from the caller', async () => {
      // The group is a rate driver. A caller who could assert it could pick their own price
      // band — a motorcycle factor on a truck.
      modelFindUnique.mockResolvedValue(model({ group: 'TRUCK' }))
      await service.save('u1', dto())

      expect(vehicleCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ group: 'TRUCK' }) }),
      )
    })

    it('updates the existing row when the same plate is saved again', async () => {
      vehicleFindMany.mockResolvedValue([vehicleRow()])

      await service.save('u1', dto({ productionYear: 1402 }))

      expect(vehicleCreate).not.toHaveBeenCalled()
      expect(vehicleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'v1' },
          data: expect.objectContaining({ productionYear: 1402 }),
        }),
      )
    })

    it('treats a different plate on the same model as a second vehicle', async () => {
      vehicleFindMany.mockResolvedValue([vehicleRow()])

      await service.save('u1', dto({ plate: { ...PLATE, threeDigit: '999' } }))

      expect(vehicleCreate).toHaveBeenCalled()
      expect(vehicleUpdate).not.toHaveBeenCalled()
    })

    it('refuses a model that does not exist or is withdrawn', async () => {
      modelFindUnique.mockResolvedValue(null)
      await expect(service.save('u1', dto())).rejects.toThrow(AppException)

      modelFindUnique.mockResolvedValue(model({ isActive: false }))
      await expect(service.save('u1', dto())).rejects.toThrow(AppException)
    })

    it('caps the list, in Persian, rather than growing without limit', async () => {
      vehicleCount.mockResolvedValue(MAX_SAVED_VEHICLES)

      await expect(service.save('u1', dto())).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
      })
      expect(vehicleCreate).not.toHaveBeenCalled()
    })

    it('still updates an existing plate once the cap is reached', async () => {
      // Otherwise a full list would lock the customer out of correcting a car they already saved.
      vehicleCount.mockResolvedValue(MAX_SAVED_VEHICLES)
      vehicleFindMany.mockResolvedValue([vehicleRow()])

      await expect(service.save('u1', dto({ productionYear: 1399 }))).resolves.toBeDefined()
      expect(vehicleUpdate).toHaveBeenCalled()
    })
  })

  describe('listForUser', () => {
    it('labels the row the way the picker did, in Persian', async () => {
      vehicleFindMany.mockResolvedValue([vehicleRow()])

      const [saved] = await service.listForUser('u1')

      expect(saved).toMatchObject({
        modelLabelFa: 'سایپا پراید ۱۳۱',
        groupFa: 'سواری',
        usageFa: 'شخصی',
        plateFa: '۴۴ ص ۸۲۱ ایران ۱۱',
      })
    })
  })

  describe('remove', () => {
    it('deletes the caller’s own vehicle', async () => {
      vehicleFindUnique.mockResolvedValue(vehicleRow())
      await service.remove('u1', 'v1')
      expect(vehicleDelete).toHaveBeenCalledWith({ where: { id: 'v1' } })
    })

    it('refuses to delete somebody else’s', async () => {
      vehicleFindUnique.mockResolvedValue(vehicleRow({ userId: 'someone-else' }))

      await expect(service.remove('u1', 'v1')).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(vehicleDelete).not.toHaveBeenCalled()
    })

    it('404s on a vehicle that is not there', async () => {
      vehicleFindUnique.mockResolvedValue(null)
      await expect(service.remove('u1', 'nope')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })
})
