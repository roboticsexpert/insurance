import { Test } from '@nestjs/testing'
import { ENV } from '../../config/config.module'
import { PrismaService } from '../../prisma/prisma.service'
import { MockGateway } from './mock.gateway'

describe('MockGateway', () => {
  const paymentUpdate = jest.fn()
  const paymentFindUnique = jest.fn()
  let gateway: MockGateway

  beforeEach(async () => {
    jest.clearAllMocks()
    paymentUpdate.mockResolvedValue({})
    const moduleRef = await Test.createTestingModule({
      providers: [
        MockGateway,
        {
          provide: PrismaService,
          useValue: { payment: { update: paymentUpdate, findUnique: paymentFindUnique } },
        },
        { provide: ENV, useValue: { API_URL: 'http://localhost:3000' } },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    gateway = moduleRef.get(MockGateway)
  })

  const settleAs = (outcome: string, extra: Record<string, unknown> = {}) =>
    paymentFindUnique.mockResolvedValue({ rawCallback: { outcome, ...extra } })

  describe('request', () => {
    it('returns a ZarinPal-shaped authority and a redirect to the mock page', async () => {
      const result = await gateway.request({ orderId: 'o1', amount: 1_000_000, descriptionFa: 'x' })
      // 36 chars beginning with A, so nothing downstream changes for a real gateway.
      expect(result.authority).toMatch(/^A[a-f0-9]{35}$/)
      expect(result.redirectUrl).toBe(
        `http://localhost:3000/mock-gateway?Authority=${result.authority}`,
      )
    })

    it('never repeats an authority', async () => {
      const authorities = await Promise.all(
        Array.from({ length: 50 }, () =>
          gateway.request({ orderId: 'o1', amount: 1, descriptionFa: 'x' }).then((r) => r.authority),
        ),
      )
      expect(new Set(authorities).size).toBe(50)
    })
  })

  describe('settle', () => {
    it('records a successful payment with a receipt number and masked card', async () => {
      await gateway.settle('A1', 'PAID')
      const entry = paymentUpdate.mock.calls[0][0].data.rawCallback
      expect(entry.outcome).toBe('PAID')
      expect(entry.refId).toMatch(/^\d{9}$/)
      expect(entry.cardMask).toMatch(/^6037-99\*\*-\*\*\*\*-\d{4}$/)
    })

    it('records a failure without inventing a receipt', async () => {
      await gateway.settle('A1', 'FAILED')
      const entry = paymentUpdate.mock.calls[0][0].data.rawCallback
      expect(entry.outcome).toBe('FAILED')
      expect(entry.refId).toBeUndefined()
    })
  })

  describe('verify', () => {
    it('confirms a settled payment and returns the receipt', async () => {
      settleAs('PAID', { refId: '123456789', cardMask: '6037-99**-****-4321' })
      await expect(gateway.verify({ authority: 'A1' })).resolves.toEqual({
        ok: true,
        refId: '123456789',
        cardMask: '6037-99**-****-4321',
      })
    })

    /*
     * The security property this mock exists to enforce. The customer controls the callback
     * URL, so a gateway that believes `Status=OK` hands out free policies to anyone who can
     * edit a query string. Verification reads the ledger; the URL parameter is ignored.
     */
    it('does not believe a Status=OK on an unsettled payment', async () => {
      paymentFindUnique.mockResolvedValue({ rawCallback: null })
      await expect(gateway.verify({ authority: 'A1', status: 'OK' })).resolves.toMatchObject({
        ok: false,
      })
    })

    it('does not believe a Status=OK on a payment the bank declined', async () => {
      settleAs('FAILED')
      const result = await gateway.verify({ authority: 'A1', status: 'OK' })
      expect(result.ok).toBe(false)
      expect(result.reasonFa).toBe('پرداخت توسط بانک تأیید نشد.')
    })

    it('still confirms a real payment even if the URL says NOK', async () => {
      settleAs('PAID', { refId: '1' })
      await expect(gateway.verify({ authority: 'A1', status: 'NOK' })).resolves.toMatchObject({
        ok: true,
      })
    })

    it('reports a cancellation in the customer’s own terms', async () => {
      settleAs('CANCELLED')
      await expect(gateway.verify({ authority: 'A1' })).resolves.toMatchObject({
        ok: false,
        reasonFa: 'پرداخت توسط شما لغو شد.',
      })
    })

    it('refuses an authority it has never seen', async () => {
      paymentFindUnique.mockResolvedValue(null)
      await expect(gateway.verify({ authority: 'nope' })).resolves.toMatchObject({
        ok: false,
        reasonFa: 'تراکنش پیدا نشد.',
      })
    })
  })
})
