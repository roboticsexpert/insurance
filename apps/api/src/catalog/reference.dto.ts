/**
 * One shape for every dropdown in the app, so the web can render any of them with a single
 * component instead of a bespoke type per list.
 */
export interface ReferenceItem {
  value: string
  labelFa: string
  /** Groups options under a heading — province for cities, brand for vehicle models. */
  groupFa?: string
  /** Anything the form needs alongside the choice, e.g. a model's vehicle group. */
  meta?: Record<string, string | number>
}

export const REFERENCE_KEYS = [
  'cities',
  'provinces',
  'vehicle-models',
  'travel-zones',
  'travel-coverages',
  'vehicle-usages',
  'vehicle-groups',
  'property-tiers',
  'property-types',
  'extra-perils',
  'plate-letters',
] as const

export type ReferenceKey = (typeof REFERENCE_KEYS)[number]

export const isReferenceKey = (value: string): value is ReferenceKey =>
  (REFERENCE_KEYS as readonly string[]).includes(value)
