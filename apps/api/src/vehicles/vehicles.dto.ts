import { z } from 'zod'
import { plateSchema } from '../products/schemas/common'
import { VehicleGroup, VehicleUsage } from '../products/schemas/motor-tpl'

/**
 * A saved vehicle is a **convenience copy**, not a source of truth. Quoting still sends every
 * field explicitly, so a stale saved row can never silently change a price — it only saves the
 * customer retyping their plate.
 */
export const saveVehicleSchema = z.object({
  vehicleModelId: z.string().min(1, { message: 'خودرو را انتخاب کنید' }),
  plate: plateSchema,
  productionYear: z
    .number()
    .int()
    .min(1350, { message: 'سال ساخت نامعتبر' })
    .max(1420, { message: 'سال ساخت نامعتبر' }),
  usage: z.nativeEnum(VehicleUsage),
})
export type SaveVehicleDto = z.infer<typeof saveVehicleSchema>

export interface VehicleDto {
  id: string
  vehicleModelId: string
  /** `سایپا پراید ۱۳۱` — the label the picker showed, so the list reads the same as the form. */
  modelLabelFa: string
  brandFa: string
  group: VehicleGroup
  groupFa: string
  usage: VehicleUsage
  usageFa: string
  productionYear: number
  plate: { twoDigit: string; letter: string; threeDigit: string; iranCode: string }
  plateFa: string
  createdAt: string
}
