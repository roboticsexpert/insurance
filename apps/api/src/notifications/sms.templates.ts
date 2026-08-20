import { formatToman } from '../common/fa'

/** Every SMS the platform can send, with its parameters. Adding one starts here. */
export interface SmsTemplates {
  OTP_LOGIN: { code: string }
  POLICY_ISSUED: { policyNumber: string; productTitleFa: string }
  PAYMENT_FAILED: { amountRial: number }
}

export type SmsTemplateKey = keyof SmsTemplates

export interface RenderedSms {
  /** What the customer receives. */
  body: string
  /**
   * What gets written to `SmsLog`. For anything carrying a live credential this is the
   * redacted form — an OTP sitting in plaintext in the database would undo the whole point
   * of hashing it in `OtpChallenge`.
   */
  logBody: string
}

const BRAND = 'بیمه ۲۴۷'

const renderers: { [K in SmsTemplateKey]: (params: SmsTemplates[K]) => RenderedSms } = {
  /*
   * Latin digits on purpose: iOS and Android only offer one-tap OTP autofill when they can
   * recognise the code, and they do not recognise Persian numerals. This is the one place in
   * the product where Latin digits are correct.
   */
  OTP_LOGIN: ({ code }) => ({
    body: `کد ورود شما به ${BRAND}: ${code}\nاین کد را در اختیار کسی قرار ندهید.`,
    logBody: `کد ورود شما به ${BRAND}: ${'*'.repeat(code.length)}\nاین کد را در اختیار کسی قرار ندهید.`,
  }),

  POLICY_ISSUED: ({ policyNumber, productTitleFa }) => {
    const body = `${productTitleFa} شما صادر شد.\nشماره بیمه‌نامه: ${policyNumber}\n${BRAND}`
    return { body, logBody: body }
  },

  PAYMENT_FAILED: ({ amountRial }) => {
    const body = `پرداخت ${formatToman(amountRial)} انجام نشد. اگر مبلغی کسر شده، تا ۷۲ ساعت بازمی‌گردد.\n${BRAND}`
    return { body, logBody: body }
  },
}

export function renderSms<K extends SmsTemplateKey>(
  template: K,
  params: SmsTemplates[K],
): RenderedSms {
  return renderers[template](params)
}
