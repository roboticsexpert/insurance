import { formatToman, toPersianDigits } from '../common/fa'

const jalali = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

const jalaliDate = (value: Date | string): string =>
  jalali.format(value instanceof Date ? value : new Date(value))

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

export interface PolicyDocumentInput {
  policyNumber: string
  startsAt: Date
  endsAt: Date
  issuedAt: Date
  snapshot: {
    productTitleFa?: string
    insurerName?: string
    insured?: { firstName?: string; lastName?: string; nationalCode?: string; passportNo?: string; birthDate?: string }[]
    coverages?: { labelFa?: string; valueFa?: string }[]
    lineItems?: { labelFa?: string; amount?: number; kind?: string }[]
    totalAmount?: number
  }
  /** Where a reader can check this policy is genuine. */
  verifyUrl: string
}

const row = (label: string, value: string): string =>
  `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`

/**
 * Renders the policy the customer receives.
 *
 * Built **only** from `dataSnapshot` and the `Policy` row — never from live joins. Rate tables
 * are replaced and profiles are edited; a policy issued last year must still print exactly what
 * was sold. If this function ever needs another table, the snapshot is missing something.
 */
export function renderPolicyDocument(input: PolicyDocumentInput): string {
  const { snapshot: s } = input

  const insuredRows = (s.insured ?? [])
    .map(
      (person, index) => `
      <tr>
        <td>${toPersianDigits(index + 1)}</td>
        <td>${escapeHtml([person.firstName, person.lastName].filter(Boolean).join(' '))}</td>
        <td>${person.nationalCode ? toPersianDigits(escapeHtml(person.nationalCode)) : '—'}</td>
        <td>${person.birthDate ? escapeHtml(jalaliDate(person.birthDate)) : '—'}</td>
        <td dir="ltr">${escapeHtml(person.passportNo ?? '—')}</td>
      </tr>`,
    )
    .join('')

  const coverageRows = (s.coverages ?? [])
    .map((c) => `<tr><th>${escapeHtml(c.labelFa)}</th><td>${escapeHtml(c.valueFa)}</td></tr>`)
    .join('')

  const premiumRows = (s.lineItems ?? [])
    .map(
      (item) => `
      <tr>
        <th>${escapeHtml(item.labelFa)}</th>
        <td>${item.kind === 'DISCOUNT' ? '−' : ''}${escapeHtml(formatToman(Math.abs(item.amount ?? 0)))}</td>
      </tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>بیمه‌نامه ${escapeHtml(input.policyNumber)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #f2f4f7; color: #1a222e;
    font-family: Tahoma, "Segoe UI", system-ui, sans-serif; font-size: 13px; line-height: 2;
    padding: 16px;
  }
  .sheet { max-width: 780px; margin: 0 auto; background: #fff; padding: 26px 28px 22px;
           border-radius: 8px; box-shadow: 0 6px 30px rgba(16,24,40,.08); }
  header { display: flex; align-items: flex-start; justify-content: space-between;
           border-bottom: 2px solid #0f766e; padding-bottom: 12px; }
  .brand { font-size: 18px; font-weight: 700; color: #0f766e; }
  .brand small { display: block; font-size: 11px; font-weight: 400; color: #667085; }
  .num { text-align: left; font-size: 12px; color: #667085; }
  .num strong { display: block; font-size: 15px; color: #1a222e; letter-spacing: .04em; }
  h1 { font-size: 15px; margin: 18px 0 10px; }
  h2 { font-size: 13px; margin: 20px 0 8px; color: #0f766e; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e4e7ec; padding: 6px 9px; text-align: right; vertical-align: top; }
  th { background: #f8fafc; font-weight: 600; width: 34%; color: #475467; }
  .people th { width: auto; background: #f8fafc; }
  .people td { width: auto; }
  .total th, .total td { background: #f0fdfa; font-weight: 700; color: #0f766e; }
  footer { margin-top: 20px; border-top: 1px solid #e4e7ec; padding-top: 12px;
           font-size: 11px; color: #667085; }
  .verify { direction: ltr; text-align: left; font-family: monospace; font-size: 10px; color: #98a2b3; }
  .sample { margin-top: 14px; padding: 8px 12px; border: 1px dashed #f59e0b;
            background: #fffbeb; color: #92400e; font-size: 11px; border-radius: 6px; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; padding: 0; max-width: none; }
  }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <div class="brand">بیمه ۲۴۷<small>صادرکننده: ${escapeHtml(s.insurerName ?? '—')}</small></div>
    <div class="num">شماره بیمه‌نامه<strong dir="ltr">${escapeHtml(input.policyNumber)}</strong></div>
  </header>

  <h1>${escapeHtml(s.productTitleFa ?? 'بیمه‌نامه')}</h1>

  <table>
    ${row('تاریخ صدور', jalaliDate(input.issuedAt))}
    ${row('شروع اعتبار', jalaliDate(input.startsAt))}
    ${row('پایان اعتبار', jalaliDate(input.endsAt))}
  </table>

  <h2>بیمه‌شدگان</h2>
  <table class="people">
    <tr><th>ردیف</th><th>نام و نام خانوادگی</th><th>کد ملی</th><th>تاریخ تولد</th><th>شماره گذرنامه</th></tr>
    ${insuredRows || '<tr><td colspan="5">—</td></tr>'}
  </table>

  <h2>پوشش‌ها</h2>
  <table>${coverageRows || row('—', '—')}</table>

  <h2>حق بیمه</h2>
  <table>
    ${premiumRows}
    <tr class="total"><th>مبلغ پرداخت‌شده</th><td>${escapeHtml(formatToman(s.totalAmount ?? 0))}</td></tr>
  </table>

  <footer>
    <p>
      این بیمه‌نامه بر اساس اطلاعات اعلام‌شده از سوی بیمه‌گذار صادر شده است. در صورت مغایرت
      اطلاعات، تعهدات بیمه‌گر مطابق شرایط عمومی و خصوصی بیمه‌نامه خواهد بود.
    </p>
    <p class="verify">${escapeHtml(input.verifyUrl)}</p>
  </footer>

  <div class="sample">
    این سند نمونه است و ارزش قانونی ندارد. نرخ‌ها و صدور در این نسخه شبیه‌سازی شده‌اند.
  </div>
</div>
</body>
</html>`
}
