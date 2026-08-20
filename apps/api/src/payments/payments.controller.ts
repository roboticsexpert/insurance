import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { verifyPaymentSchema, type VerifyPaymentDto, type VerifyPaymentResponse } from './payments.dto'
import { PaymentsService } from './payments.service'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Unauthenticated on purpose. The money moved whether or not the customer's browser came
   * back, so verification must not depend on a live session — the authority is the capability.
   * It reports what the gateway decided; it cannot make a payment succeed.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(
    @Body(new ZodValidationPipe(verifyPaymentSchema)) body: VerifyPaymentDto,
  ): Promise<VerifyPaymentResponse> {
    return this.payments.verify(body)
  }
}
