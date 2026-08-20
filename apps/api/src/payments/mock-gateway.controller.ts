import { Body, Controller, Get, Inject, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { z } from 'zod'
import { AppException } from '../common/app.exception'
import { formatToman, toPersianDigits } from '../common/fa'
import { ENV } from '../config/config.module'
import type { Env } from '../config/env'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { PrismaService } from '../prisma/prisma.service'
import { MockGateway, type MockOutcome } from './gateways/mock.gateway'
import { renderMockGatewayPage } from './mock-gateway.page'

const settleSchema = z.object({
  authority: z.string().min(1),
  outcome: z.enum(['PAID', 'FAILED', 'CANCELLED']),
})

/**
 * Stands in for the bank's hosted page. Reachable only while `PAYMENT_GATEWAY=mock`; with any
 * real gateway configured these routes behave as if they do not exist.
 */
@Controller()
export class MockGatewayController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockGateway,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get('mock-gateway')
  async page(@Query('Authority') authority: string, @Res() res: Response): Promise<void> {
    this.assertMockEnabled()

    const payment = authority
      ? await this.prisma.payment.findUnique({
          where: { authority },
          include: {
            order: { include: { quoteOffer: { include: { insurer: true, quote: { include: { product: true } } } } } },
          },
        })
      : null

    if (!payment) {
      res.status(404).type('html').send(renderMockGatewayPage({ kind: 'not-found' }))
      return
    }

    const { order } = payment
    res.type('html').send(
      renderMockGatewayPage({
        kind: 'form',
        authority: payment.authority,
        amountFa: formatToman(payment.amount),
        productTitleFa: order.quoteOffer.quote.product.titleFa,
        insurerNameFa: order.quoteOffer.insurer.name,
        // Shaparak shows a payment deadline; mirroring it keeps the mock convincing.
        deadlineSeconds: 15 * 60,
      }),
    )
  }

  @Post('mock-gateway/settle')
  async settle(
    @Body(new ZodValidationPipe(settleSchema)) body: { authority: string; outcome: MockOutcome },
    @Res() res: Response,
  ): Promise<void> {
    this.assertMockEnabled()
    await this.gateway.settle(body.authority, body.outcome)

    /*
     * `Status` mirrors what a real gateway appends, and the app must keep treating it as a
     * hint about *why* the customer is back — never as proof of payment. Verification reads
     * the ledger.
     */
    const status = body.outcome === 'PAID' ? 'OK' : 'NOK'
    res.redirect(
      `${this.env.WEB_URL}/payment/callback?Authority=${encodeURIComponent(body.authority)}&Status=${status}`,
    )
  }

  private assertMockEnabled(): void {
    if (this.env.PAYMENT_GATEWAY !== 'mock') throw new AppException('NOT_FOUND')
  }
}

export const mockGatewayDigits = toPersianDigits
