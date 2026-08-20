import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { SmsMessage, SmsSendResult, SmsSender } from './sms-sender'

/**
 * The MVP sender: prints the message instead of sending it, so a developer never has to own a
 * phone to test a login. Prints the real body — including the OTP — which is exactly why it
 * must never be selected in production (`SMS_PROVIDER` is validated at boot).
 */
@Injectable()
export class ConsoleSmsSender implements SmsSender {
  private readonly logger = new Logger('SMS')

  async send({ mobile, body }: SmsMessage): Promise<SmsSendResult> {
    const providerRef = `console:${randomUUID()}`
    this.logger.log(`→ 0${mobile}\n${body}`)
    return { providerRef }
  }
}
