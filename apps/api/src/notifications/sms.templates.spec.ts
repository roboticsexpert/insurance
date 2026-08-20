import { renderSms } from './sms.templates'

describe('SMS templates', () => {
  describe('OTP_LOGIN', () => {
    const rendered = renderSms('OTP_LOGIN', { code: '1234' })

    // The brand name «بیمه ۲۴۷» carries Persian digits of its own, so the assertion has to be
    // about the code rather than about the message containing no Persian digits at all.
    it('sends the code in Latin digits so the phone can offer autofill', () => {
      expect(rendered.body).toContain('1234')
      expect(rendered.body).not.toContain('۱۲۳۴')
    })

    it('never puts the live code in what gets persisted', () => {
      expect(rendered.logBody).not.toContain('1234')
      expect(rendered.logBody).toContain('****')
    })

    it('warns the recipient not to share it', () => {
      expect(rendered.body).toContain('در اختیار کسی قرار ندهید')
    })
  })

  it('renders an issued policy with its number', () => {
    const { body, logBody } = renderSms('POLICY_ISSUED', {
      policyNumber: 'PAS-TRV-0508-000123',
      productTitleFa: 'بیمه مسافرتی',
    })
    expect(body).toContain('PAS-TRV-0508-000123')
    expect(body).toContain('بیمه مسافرتی')
    // Nothing sensitive here, so the log keeps the full text.
    expect(logBody).toBe(body)
  })

  it('renders a failed payment as Tomans with Persian typography', () => {
    const { body } = renderSms('PAYMENT_FAILED', { amountRial: 42500000 })
    expect(body).toContain('۴٬۲۵۰٬۰۰۰ تومان')
    expect(body).toContain('۷۲ ساعت')
  })
})
