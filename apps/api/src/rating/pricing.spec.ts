import { ineligible, PremiumBuilder, pickBand } from './pricing'

describe('pickBand', () => {
  const bands = [
    { max: 7, factor: 1 },
    { max: 15, factor: 1.5 },
    { max: 31, factor: 2.2 },
  ]

  it.each([
    [1, 1],
    [7, 1],
    [8, 1.5],
    [15, 1.5],
    [16, 2.2],
    [31, 2.2],
  ])('value %i falls in the band with factor %f', (value, factor) => {
    expect(pickBand(bands, value).factor).toBe(factor)
  })

  // A value past the final bound must still price, not fall through to undefined.
  it('uses the last band for anything above the final bound', () => {
    expect(pickBand(bands, 9999).factor).toBe(2.2)
  })

  it('refuses an empty band list rather than returning nonsense', () => {
    expect(() => pickBand([], 5)).toThrow('empty band list')
  })
})

describe('PremiumBuilder', () => {
  it('sums premium lines, rounds to the nearest 1,000 Rial, and totals', () => {
    const { netPremium, totalAmount, lineItems } = new PremiumBuilder()
      .premium('base', 'حق بیمه پایه', 2_600_400)
      .build()

    expect(netPremium).toBe(2_600_000)
    expect(totalAmount).toBe(2_600_000)
    expect(lineItems).toHaveLength(1)
  })

  it('records discounts as negative lines and nets them off', () => {
    const { netPremium, lineItems } = new PremiumBuilder()
      .premium('base', 'حق بیمه پایه', 3_000_000)
      .discount('noclaim', 'تخفیف عدم خسارت', 500_000)
      .build()

    expect(netPremium).toBe(2_500_000)
    expect(lineItems[1]).toMatchObject({ amount: -500_000, kind: 'DISCOUNT' })
  })

  it('takes the absolute value of a discount passed as a negative', () => {
    const { netPremium } = new PremiumBuilder()
      .premium('base', 'پایه', 1_000_000)
      .discount('d', 'تخفیف', -200_000)
      .build()
    expect(netPremium).toBe(800_000)
  })

  // The invariant that keeps an invoice honest: levies are their own lines.
  it('keeps tax and fees out of the net premium', () => {
    const { netPremium, totalAmount, lineItems } = new PremiumBuilder()
      .premium('base', 'حق بیمه پایه', 1_000_000)
      .fee('stamp', 'حق تمبر', 20_000)
      .withTax(0.1)
      .build()

    expect(netPremium).toBe(1_000_000)
    expect(totalAmount).toBe(1_120_000)
    expect(lineItems.map((i) => i.kind)).toEqual(['PREMIUM', 'FEE', 'TAX'])
    expect(lineItems.find((i) => i.kind === 'TAX')?.amount).toBe(100_000)
  })

  /*
   * The ordering trap this design removes: declaring tax before adding another premium line
   * would under-charge if tax were computed when declared. It is computed at build().
   */
  it('taxes the final net premium regardless of when tax was declared', () => {
    const early = new PremiumBuilder()
      .withTax(0.1)
      .premium('a', 'الف', 1_000_000)
      .premium('b', 'ب', 1_000_000)
      .build()

    const late = new PremiumBuilder()
      .premium('a', 'الف', 1_000_000)
      .premium('b', 'ب', 1_000_000)
      .withTax(0.1)
      .build()

    expect(early.totalAmount).toBe(late.totalAmount)
    expect(early.totalAmount).toBe(2_200_000)
  })

  it('omits the tax line entirely at a zero rate', () => {
    const { lineItems } = new PremiumBuilder().premium('base', 'پایه', 1_000_000).build()
    expect(lineItems.some((i) => i.kind === 'TAX')).toBe(false)
  })

  /*
   * The invariant that matters most: what the customer is shown must add up to what they are
   * charged. Rounding the sum instead of the lines broke this by 400 Rial when first written.
   */
  it.each([
    ['fractional base', 2_600_400, 20_000, 0.1],
    ['odd rate', 1_234_567.89, 15_500, 0.09],
    ['no tax, no fee', 999_999, 0, 0],
    ['large policy', 48_765_432, 20_000, 0.1],
  ])('line items always sum exactly to the total (%s)', (_label, base, fee, rate) => {
    const builder = new PremiumBuilder().premium('base', 'پایه', base)
    if (fee > 0) builder.fee('stamp', 'حق تمبر', fee)
    if (rate > 0) builder.withTax(rate)
    const { lineItems, totalAmount, netPremium } = builder.build()

    expect(lineItems.reduce((sum, i) => sum + i.amount, 0)).toBe(totalAmount)
    expect(lineItems.filter((i) => i.kind === 'PREMIUM' || i.kind === 'DISCOUNT')
      .reduce((sum, i) => sum + i.amount, 0)).toBe(netPremium)
    expect(netPremium % 1000).toBe(0)
  })

  it('keeps every amount an integer', () => {
    const { lineItems, totalAmount } = new PremiumBuilder()
      .premium('base', 'پایه', 1_234_567.89)
      .withTax(0.09)
      .build()

    expect(Number.isInteger(totalAmount)).toBe(true)
    expect(lineItems.every((i) => Number.isInteger(i.amount))).toBe(true)
  })

  it('builds an explain trace, including the tax calculation in Persian', () => {
    const builder = new PremiumBuilder()
      .premium('base', 'پایه', 1_000_000, 'مقصد شنگن')
      .note('مدت سفر ۷ روز')
      .withTax(0.1)
    builder.build()

    expect(builder.explain).toEqual([
      'مقصد شنگن',
      'مدت سفر ۷ روز',
      'مالیات بر ارزش افزوده: ۱۰٪ از ۱۰۰٬۰۰۰ تومان',
    ])
  })

  it('produces an eligible result carrying the trace and coverages', () => {
    const result = new PremiumBuilder()
      .premium('base', 'پایه', 1_000_000)
      .note('توضیح')
      .toResult([{ key: 'medical', labelFa: 'درمان', valueFa: 'دارد' }])

    expect(result.eligible).toBe(true)
    expect(result.totalAmount).toBe(1_000_000)
    expect(result.coverages).toHaveLength(1)
    expect(result.explain).toContain('توضیح')
  })
})

describe('ineligible', () => {
  // A refusal is an outcome the UI renders, not an exception that kills the whole comparison.
  it('returns a zero-priced result carrying the Persian reason', () => {
    const result = ineligible('سن مسافر بیش از حد مجاز است.', ['سن: ۹۰'])

    expect(result.eligible).toBe(false)
    expect(result.ineligibleReasonFa).toBe('سن مسافر بیش از حد مجاز است.')
    expect(result.totalAmount).toBe(0)
    expect(result.lineItems).toEqual([])
    expect(result.explain).toEqual(['سن: ۹۰', 'رد شد: سن مسافر بیش از حد مجاز است.'])
  })
})
