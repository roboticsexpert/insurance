import { Inject, Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { renderSms, type SmsTemplateKey, type SmsTemplates } from './sms.templates'
import { SMS_SENDER, type SmsSender } from './sms-sender'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_SENDER) private readonly sender: SmsSender,
  ) {}

  /**
   * Renders a template, sends it, and records the attempt in `SmsLog` — the redacted body,
   * never the live one.
   *
   * Never throws. A failed notification must not fail the business operation that triggered
   * it: an issued policy is still issued if the SMS provider is down. Failures land in
   * `SmsLog` with status FAILED for later reconciliation.
   */
  async send<K extends SmsTemplateKey>(
    mobile: string,
    template: K,
    params: SmsTemplates[K],
  ): Promise<void> {
    const { body, logBody } = renderSms(template, params)

    try {
      const { providerRef } = await this.sender.send({ mobile, body })
      await this.record(mobile, template, logBody, 'SENT', providerRef)
    } catch (error) {
      this.logger.error({ err: error, mobile, template }, 'SMS send failed')
      await this.record(mobile, template, logBody, 'FAILED', null)
    }
  }

  private async record(
    mobile: string,
    template: string,
    body: string,
    status: 'SENT' | 'FAILED',
    providerRef: string | null,
  ): Promise<void> {
    try {
      await this.prisma.smsLog.create({ data: { mobile, template, body, status, providerRef } })
    } catch (error) {
      // Losing the audit row is bad, but not bad enough to fail a policy issuance over.
      this.logger.error({ err: error, mobile, template }, 'SmsLog write failed')
    }
  }
}
