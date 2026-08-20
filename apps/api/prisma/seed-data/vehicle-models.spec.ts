import { VEHICLE_MODELS } from './vehicle-models'
import { VehicleGroup } from '../../src/products/schemas/motor-tpl'

/*
 * The vehicle catalog is 115 rows of hand-written Persian. Nothing else in the build would
 * catch a duplicated key, a group that is not a real `VehicleGroup`, or a stray Latin digit in
 * a label — the seed would happily write all three, and the wizard would show them.
 */
describe('vehicle model seed data', () => {
  const key = (m: { brandFa: string; modelFa: string }) => `${m.brandFa}|${m.modelFa}`

  it('has a unique (brand, model) for every row', () => {
    // The seed upserts on this pair; a duplicate silently becomes one row, not two.
    const seen = new Map<string, number>()
    for (const model of VEHICLE_MODELS) seen.set(key(model), (seen.get(key(model)) ?? 0) + 1)

    expect([...seen.entries()].filter(([, count]) => count > 1)).toEqual([])
  })

  it('classifies every vehicle into a group the rating table prices', () => {
    const groups = new Set<string>(Object.values(VehicleGroup))
    for (const model of VEHICLE_MODELS) {
      expect(groups.has(model.group)).toBe(true)
    }
  })

  it('covers every group, so no group is unreachable from the wizard', () => {
    const covered = new Set(VEHICLE_MODELS.map((m) => m.group))
    expect([...Object.values(VehicleGroup)].filter((g) => !covered.has(g))).toEqual([])
  })

  it('never labels a vehicle with Latin digits', () => {
    // Model names legitimately carry Latin *letters* (X22, CG125), but a Latin digit in a
    // number that reads as Persian — «پژو 206» — is the bug this catches.
    const offenders = VEHICLE_MODELS.filter((m) => /^[؀-ۿ\s]*[0-9]/.test(m.modelFa))
    expect(offenders).toEqual([])
  })

  it('has no leading, trailing or doubled whitespace in a label', () => {
    for (const model of VEHICLE_MODELS) {
      expect(model.brandFa).toBe(model.brandFa.trim())
      expect(model.modelFa).toBe(model.modelFa.trim())
      expect(model.modelFa).not.toMatch(/\s{2,}/)
    }
  })

  it('is big enough to be a catalog rather than a sample', () => {
    // A customer who cannot find their own car abandons the form, and there is no free-text
    // fallback by design — `group` is a rate driver, so every vehicle arrives classified.
    expect(VEHICLE_MODELS.length).toBeGreaterThanOrEqual(100)
    expect(new Set(VEHICLE_MODELS.map((m) => m.brandFa)).size).toBeGreaterThanOrEqual(15)
  })
})
