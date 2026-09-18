import { homeFireInputSchema } from '../products/schemas/home-fire'
import { insuredPersonSchema } from '../products/schemas/common'
import { motorTplInputSchema } from '../products/schemas/motor-tpl'
import { travelInputSchema } from '../products/schemas/travel'

/** Any Arabic-script character. Latin-only text is the failure this whole file exists to stop. */
const hasPersian = (value: string) => /[؀-ۿ]/.test(value)

const messagesFor = (schema: { safeParse(v: unknown): unknown }, input: unknown): string[] => {
  const result = schema.safeParse(input) as
    | { success: true }
    | { success: false; error: { issues: { message: string; path: (string | number)[] }[] } }
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

/*
 * M8. `errors.ts` says the API owns every Persian string the customer reads, and all three
 * wizards render `Object.values(error.fields)` verbatim — but a field only spoke Persian if
 * somebody gave it a `message`. «Number must be less than or equal to 2000» and «Required»
 * reached the screen exactly as written.
 *
 * These cases are deliberately fields that carry **no** explicit message, because those are the
 * ones the global error map exists for. A field with its own message would pass either way.
 */
describe('the Persian zod error map', () => {
  const cases: [string, { safeParse(v: unknown): unknown }, unknown][] = [
    ['an empty travel request', travelInputSchema, {}],
    ['an empty motor request', motorTplInputSchema, {}],
    ['an empty fire request', homeFireInputSchema, {}],
    ['an empty insured person', insuredPersonSchema, {}],
    [
      'an unlisted enum value',
      homeFireInputSchema,
      { propertyType: 'CASTLE', cityId: 'c', areaSqm: 90, buildingValue: 1, contentsValue: 1, durationMonths: 12, startDate: '2026-09-01' },
    ],
    [
      'a number over its ceiling',
      homeFireInputSchema,
      { propertyType: 'APARTMENT', cityId: 'c', areaSqm: 9000, buildingValue: 1, contentsValue: 1, durationMonths: 12, startDate: '2026-09-01' },
    ],
    [
      'a discount ladder overrun',
      motorTplInputSchema,
      {
        vehicleUsage: 'PERSONAL', vehicleGroup: 'SEDAN', vehicleModelId: 'm', productionYear: 1400,
        plate: { twoDigit: '12', letter: 'ب', threeDigit: '345', iranCode: '10' },
        startDate: '2026-09-01', hasPreviousPolicy: true,
        bodilyDiscountYears: 30, propertyDiscountYears: 30, propertyCoverageTier: 'P_4',
      },
    ],
    [
      'a passport number of the wrong length',
      insuredPersonSchema,
      { firstName: 'علی', lastName: 'رضایی', nationalCode: '0499370899', birthDate: '1990-01-01', passportNo: 'x' },
    ],
    ['a wrong scalar type', homeFireInputSchema, { propertyType: 'APARTMENT', cityId: 'c', areaSqm: 90, buildingValue: 1, contentsValue: 'زیاد', durationMonths: 12, startDate: '2026-09-01' }],
  ]

  it.each(cases)('says something in Persian for %s', (_label, schema, input) => {
    const messages = messagesFor(schema, input)

    expect(messages.length).toBeGreaterThan(0)
    for (const message of messages) {
      expect(hasPersian(message)).toBe(true)
    }
  })

  // Numbers quoted back to the customer are read by the same person reading the sentence.
  it('writes numbers inside a message in Persian digits', () => {
    const messages = messagesFor(homeFireInputSchema, {
      propertyType: 'APARTMENT', cityId: 'c', areaSqm: 9000,
      buildingValue: 1, contentsValue: 1, durationMonths: 12, startDate: '2026-09-01',
    })
    expect(messages.join(' ')).toContain('۲۰۰۰')
  })

  // The map is a floor, not a replacement: a field that states its own message keeps it.
  it('leaves an explicit per-field message alone', () => {
    expect(messagesFor(homeFireInputSchema, {
      propertyType: 'APARTMENT', cityId: '', areaSqm: 90,
      buildingValue: 1, contentsValue: 1, durationMonths: 12, startDate: '2026-09-01',
    })).toContain('شهر را انتخاب کنید')
  })
})
