import { formatPolicyNumber, insurerCode, jalaliPeriod, productCode } from './policy-number'

describe('policy numbering', () => {
  it('derives a Jalali yymm period', () => {
    // 2026-08-20 is 29 Mordad 1405 → year 05, month 05.
    expect(jalaliPeriod(new Date('2026-08-20T10:00:00Z'))).toBe('0505')
    // 2026-03-21 is 1 Farvardin 1405.
    expect(jalaliPeriod(new Date('2026-03-21T10:00:00Z'))).toBe('0501')
    // 2026-03-20 is still Esfand of the previous year.
    expect(jalaliPeriod(new Date('2026-03-20T10:00:00Z'))).toBe('0412')
  })

  it.each([
    ['pasargad', 'PAS'],
    ['saman', 'SAM'],
    ['dey', 'DEY'],
    ['ab', 'ABX'], // padded, so every code is three characters
  ])('shortens %s to %s', (slug, expected) => {
    expect(insurerCode(slug)).toBe(expected)
  })

  it('maps product types to readable codes, with a fallback', () => {
    expect(productCode('TRAVEL')).toBe('TRV')
    expect(productCode('MOTOR_TPL')).toBe('TPL')
    expect(productCode('HOME_FIRE')).toBe('FIR')
    expect(productCode('SOMETHING_NEW')).toBe('GEN')
  })

  it('formats a policy number readable at a glance', () => {
    expect(
      formatPolicyNumber({
        insurerSlug: 'dey',
        productType: 'TRAVEL',
        period: '0505',
        sequence: 123,
      }),
    ).toBe('DEY-TRV-0505-000123')
  })

  it('pads the sequence so numbers sort lexicographically', () => {
    const numbers = [1, 20, 300].map((sequence) =>
      formatPolicyNumber({ insurerSlug: 'dey', productType: 'TRAVEL', period: '0505', sequence }),
    )
    expect([...numbers].sort()).toEqual(numbers)
  })
})
