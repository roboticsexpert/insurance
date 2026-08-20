import { Inject, Injectable, Logger } from '@nestjs/common'
import { PaymentStatus, type Prisma } from '@prisma/client'
import { randomBytes, randomInt } from 'node:crypto'
import { ENV } from '../../config/config.module'
import type { Env } from '../../config/env'
import { PrismaService } from '../../prisma/prisma.service'
import type {
  PaymentGateway,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyResult,
} from '../payment-gateway'

export type MockOutcome = 'PAID' | 'FAILED' | 'CANCELLED'

interface MockLedgerEntry {
  outcome: MockOutcome
  refId?: string
  cardMask?: string
  settledAt: string
}

/** ZarinPal authorities are 36 characters beginning with `A`. Same shape, so nothing downstream
 *  has to change when a real gateway replaces this. */
const newAuthority = (): string => `A${randomBytes(18).toString('hex').slice(0, 35)}`

/** A plausible Iranian card: 6037 is Bank Melli's BIN. */
const newCardMask = (): string => `6037-99**-****-${String(randomInt(1000, 10000))}`

@Injectable()
export class MockGateway implements PaymentGateway {
  readonly name = 'mock'
  private readonly logger = new Logger(MockGateway.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async request(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const authority = newAuthority()
    return {
      authority,
      redirectUrl: `${this.env.API_URL}/mock-gateway?Authority=${authority}`,
    }
  }

  /**
   * Records what the customer chose on the mock bank page. This stands in for the PSP's own
   * ledger — the thing a real `verify` would query server-to-server.
   */
  async settle(authority: string, outcome: MockOutcome): Promise<void> {
    const entry: MockLedgerEntry = {
      outcome,
      settledAt: new Date().toISOString(),
      ...(outcome === 'PAID'
        ? { refId: String(randomInt(100_000_000, 999_999_999)), cardMask: newCardMask() }
        : {}),
    }

    await this.prisma.payment.update({
      where: { authority },
      data: { rawCallback: entry as unknown as Prisma.InputJsonValue, status: PaymentStatus.REDIRECTED },
    })
  }

  /**
   * Reads the recorded outcome — **not** the `status` in the return URL.
   *
   * That distinction is the whole point. The customer's browser controls the callback query
   * string, so a gateway that believes `Status=OK` hands out free policies to anyone who can
   * edit a URL. A real integration verifies against the PSP; this verifies against the ledger
   * the mock page wrote. The parameter is accepted for interface fidelity and ignored.
   */
  async verify({ authority }: { authority: string; status?: string }): Promise<PaymentVerifyResult> {
    const payment = await this.prisma.payment.findUnique({ where: { authority } })

    if (!payment) {
      this.logger.warn({ authority }, 'Verify for an unknown authority')
      return { ok: false, reasonFa: 'تراکنش پیدا نشد.' }
    }

    const entry = payment.rawCallback as unknown as MockLedgerEntry | null

    if (!entry?.outcome) {
      // Came back without ever settling — an abandoned tab, or a hand-crafted callback.
      return { ok: false, reasonFa: 'پرداخت تکمیل نشد.' }
    }

    if (entry.outcome === 'PAID') {
      return {
        ok: true,
        ...(entry.refId ? { refId: entry.refId } : {}),
        ...(entry.cardMask ? { cardMask: entry.cardMask } : {}),
      }
    }

    return {
      ok: false,
      reasonFa:
        entry.outcome === 'CANCELLED' ? 'پرداخت توسط شما لغو شد.' : 'پرداخت توسط بانک تأیید نشد.',
    }
  }
}
