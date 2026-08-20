import { HttpException } from '@nestjs/common'
import { ERROR_MESSAGE_FA, ERROR_STATUS, type ErrorCode } from './errors'

/**
 * The only exception this codebase throws on purpose. A throw site names a code; the status
 * and the Persian wording come from the tables in `errors.ts`.
 *
 *   throw new AppException('QUOTE_EXPIRED')
 *   throw new AppException('VALIDATION_FAILED', { fields: { mobile: 'شماره معتبر نیست' } })
 */
export class AppException extends HttpException {
  readonly code: ErrorCode
  readonly fields?: Record<string, string>

  constructor(
    code: ErrorCode,
    options: {
      /** Overrides the table wording when a specific case deserves specific words. */
      messageFa?: string
      fields?: Record<string, string>
      /** Logged, never sent to the client. */
      cause?: unknown
    } = {},
  ) {
    super(options.messageFa ?? ERROR_MESSAGE_FA[code], ERROR_STATUS[code], { cause: options.cause })
    this.code = code
    this.fields = options.fields
  }
}
