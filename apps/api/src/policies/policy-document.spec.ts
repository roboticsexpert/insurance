import { renderPolicyDocument, type PolicyDocumentInput } from './policy-document'

const base: PolicyDocumentInput = {
  policyNumber: 'DEY-TRV-0505-000042',
  startsAt: new Date('2026-10-02T00:00:00Z'),
  endsAt: new Date('2026-10-12T23:59:59Z'),
  issuedAt: new Date('2026-08-20T10:00:00Z'),
  verifyUrl: 'https://app.bimegold.com/policies/pol1',
  snapshot: {
    productTitleFa: 'بیمه مسافرتی',
    insurerName: 'بیمه دی',
    insured: [
      {
        firstName: 'مهدی',
        lastName: 'یوسف‌تبار',
        nationalCode: '0499370899',
        birthDate: '1990-05-20',
        passportNo: 'A1234567',
      },
    ],
    coverages: [{ labelFa: 'هزینه‌های درمانی', valueFa: '۳۰ هزار یورو' }],
    lineItems: [
      { labelFa: 'حق بیمه — مسافر ۱', amount: 3_471_000, kind: 'PREMIUM' },
      { labelFa: 'تخفیف', amount: -100_000, kind: 'DISCOUNT' },
      { labelFa: 'مالیات بر ارزش افزوده', amount: 347_100, kind: 'TAX' },
    ],
    totalAmount: 3_838_100,
  },
}

const render = (over: Partial<PolicyDocumentInput['snapshot']> = {}) =>
  renderPolicyDocument({ ...base, snapshot: { ...base.snapshot, ...over } })

describe('renderPolicyDocument', () => {
  const html = render()

  it('is a Persian RTL document', () => {
    expect(html).toContain('<html lang="fa" dir="rtl">')
    expect(html).toContain('بیمه ۲۴۷')
  })

  it('shows the policy number and the issuing insurer', () => {
    expect(html).toContain('DEY-TRV-0505-000042')
    expect(html).toContain('بیمه دی')
  })

  // Cover dates are what a customer checks first; they must be Jalali, not Gregorian.
  it('prints dates in Jalali', () => {
    expect(html).toContain('۱۰ مهر ۱۴۰۵') // 2026-10-02
    expect(html).toContain('۲۰ مهر ۱۴۰۵') // 2026-10-12
    expect(html).toContain('۲۹ مرداد ۱۴۰۵') // issued 2026-08-20
  })

  it('lists the insured with their identifiers', () => {
    expect(html).toContain('مهدی یوسف‌تبار')
    expect(html).toContain('۰۴۹۹۳۷۰۸۹۹')
    expect(html).toContain('A1234567')
  })

  it('shows the premium breakdown, with discounts signed', () => {
    expect(html).toContain('۳۴۷٬۱۰۰ تومان')
    expect(html).toContain('−۱۰٬۰۰۰ تومان')
    expect(html).toContain('۳۸۳٬۸۱۰ تومان')
  })

  it('carries a print stylesheet and an A4 page', () => {
    expect(html).toContain('@page')
    expect(html).toContain('@media print')
  })

  // Placeholder rates are still in play; the document must not look authoritative.
  it('says plainly that it is a sample', () => {
    expect(html).toContain('ارزش قانونی ندارد')
  })

  it('includes a verification address', () => {
    expect(html).toContain('https://app.bimegold.com/policies/pol1')
  })

  /*
   * The snapshot is JSON written months earlier by an older version of the code. A missing
   * field must render a dash, not crash the one document a customer needs at an embassy.
   */
  it.each([
    ['no insured', { insured: undefined }],
    ['no coverages', { coverages: undefined }],
    ['no line items', { lineItems: undefined }],
    ['empty snapshot', { productTitleFa: undefined, insurerName: undefined, totalAmount: undefined }],
  ])('survives a snapshot with %s', (_label, patch) => {
    expect(() => render(patch)).not.toThrow()
  })

  it('escapes text so a name cannot inject markup', () => {
    const injected = render({
      insured: [{ firstName: '<script>alert(1)</script>', lastName: 'x' }],
    })
    expect(injected).not.toContain('<script>alert(1)</script>')
    expect(injected).toContain('&lt;script&gt;')
  })
})
