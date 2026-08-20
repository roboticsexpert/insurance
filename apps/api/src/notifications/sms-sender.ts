export const SMS_SENDER = Symbol('SMS_SENDER')

export interface SmsMessage {
  /** Canonical `9XXXXXXXXX`. */
  mobile: string
  body: string
}

export interface SmsSendResult {
  /** The provider's id for this message, kept for support and reconciliation. */
  providerRef: string
}

/**
 * The seam a real Iranian SMS provider (Kavenegar, SMS.ir, Ghasedak) drops into.
 * Implementations must throw on failure — the caller records the failure in `SmsLog`.
 */
export interface SmsSender {
  send(message: SmsMessage): Promise<SmsSendResult>
}
