import { apiFetch } from './api'
import type { Plate } from './plate'

export interface SavedVehicle {
  id: string
  vehicleModelId: string
  modelLabelFa: string
  brandFa: string
  group: string
  groupFa: string
  usage: string
  usageFa: string
  productionYear: number
  plate: Plate
  plateFa: string
  createdAt: string
}

export interface SaveVehicleBody {
  vehicleModelId: string
  plate: Plate
  productionYear: number
  usage: string
}

export const getVehicles = () => apiFetch<SavedVehicle[]>('/me/vehicles')

export const saveVehicle = (body: SaveVehicleBody) =>
  apiFetch<SavedVehicle>('/me/vehicles', { method: 'POST', body })

export const deleteVehicle = (id: string) =>
  apiFetch<void>(`/me/vehicles/${id}`, { method: 'DELETE' })
