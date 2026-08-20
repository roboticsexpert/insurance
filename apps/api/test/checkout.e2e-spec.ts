import { randomUUID } from 'node:crypto'
import request from 'supertest'
import type { App } from 'supertest/types'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { createE2eApp, resetDatabase, type E2eContext } from './helpers/app'

const MOBILE = '09121110000'

/** One adult, one zone, ten days out — the cheapest quote the travel tables can price. */
const TRAVEL_INPUT = {
  destinationZone: 'SCHENGEN',
  startDate: '2026-11-01',
  endDate: '2026-11-11',
  coverageLimit: 'EUR_30K',
  travelers: [{ birthDate: '1990-05-20' }],
}

/** Matches the single traveler above — the order is refused if the two disagree. */
const INSURED = [
  {
    firstName: 'مهدی',
    lastName: 'یوسف‌تبار',
    nationalCode: '0084575948',
    birthDate: '1990-05-20',
    passportNo: 'K12345678',
  },
]

describe('checkout (e2e)', () => {
  let ctx: E2eContext
  let http: App

  beforeAll(async () => {
    ctx = await createE2eApp()
    http = ctx.app.getHttpServer() as App
  })

  afterAll(async () => {
    await ctx.db.$disconnect()
    await ctx.app.close()
  })

  beforeEach(() => resetDatabase(ctx.db))

  const login = async (): Promise<string> => {
    await request(http).post(`${ctx.api}/auth/otp/request`).send({ mobile: MOBILE }).expect(200)
    const verified = await request(http)
      .post(`${ctx.api}/auth/otp/verify`)
      .send({ mobile: MOBILE, code: '1234' })
      .expect(200)
    return verified.body.accessToken as string
  }

  /** Quotes signed out on purpose — that is the funnel the app actually ships. */
  const quote = async () => {
    const res = await request(http)
      .post(`${ctx.api}/quotes`)
      .send({ productSlug: 'travel', input: TRAVEL_INPUT })
      .expect(201)
    return res.body
  }

  const placeOrder = (token: string, quoteOfferId: string, idempotencyKey = randomUUID()) =>
    request(http)
      .post(`${ctx.api}/orders`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quoteOfferId, insured: INSURED, idempotencyKey })

  const startPayment = (token: string, orderId: string) =>
    request(http).post(`${ctx.api}/orders/${orderId}/pay`).set('Authorization', `Bearer ${token}`)

  /** Drives the mock bank page exactly as the customer's browser does: a form POST. */
  const settle = (authority: string, outcome: 'PAID' | 'FAILED' | 'CANCELLED') =>
    request(http).post('/mock-gateway/settle').type('form').send({ authority, outcome })

  const verify = (authority: string, status = 'OK') =>
    request(http).post(`${ctx.api}/payments/verify`).send({ authority, status })

  /** Everything up to the customer landing on the bank page. */
  const reachTheBank = async () => {
    const token = await login()
    const q = await quote()
    const offer = q.offers.find((o: { isEligible: boolean }) => o.isEligible)
    const order = (await placeOrder(token, offer.id).expect(201)).body
    const pay = (await startPayment(token, order.id).expect(201)).body
    return { token, quote: q, offer, order, authority: pay.authority as string }
  }

  describe('the whole purchase', () => {
    it('carries one price from quote to policy', async () => {
      const { token, offer, order, authority } = await reachTheBank()

      // The quoted price is frozen on the order: nothing reprices between here and issuance.
      expect(order.amount).toBe(offer.totalAmount)
      expect(order.status).toBe(OrderStatus.PENDING_PAYMENT)

      // The bank page renders for this authority, and the redirect leaves the API prefix behind.
      const bank = await request(http).get(`/mock-gateway?Authority=${authority}`).expect(200)
      expect(bank.text).toContain('mock-gateway/settle')

      const redirect = await settle(authority, 'PAID').expect(302)
      expect(redirect.headers.location).toContain('/payment/callback')
      expect(redirect.headers.location).toContain(`Authority=${authority}`)

      const verified = await verify(authority).expect(200)
      expect(verified.body).toMatchObject({
        orderId: order.id,
        amount: offer.totalAmount,
        orderStatus: OrderStatus.ISSUED,
        paymentStatus: PaymentStatus.SUCCEEDED,
      })
      expect(verified.body.policyId).toEqual(expect.any(String))
      expect(verified.body.refId).toEqual(expect.any(String))

      // The policy the customer can now open is the one issuance created.
      const policy = await request(http)
        .get(`${ctx.api}/policies/${verified.body.policyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(policy.body.amount).toBe(offer.totalAmount)
      expect(policy.body.policyNumber).toMatch(/^[A-Z]+-TRV-\d{4}-\d{6}$/)
      expect(policy.body.insured[0]).toMatchObject({ nationalCode: INSURED[0]!.nationalCode })

      const list = await request(http)
        .get(`${ctx.api}/policies`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      expect(list.body).toHaveLength(1)

      // Issuance told the customer. The OTP that logged them in is the only other message.
      const sms = await ctx.db.smsLog.findMany({ where: { template: 'POLICY_ISSUED' } })
      expect(sms).toHaveLength(1)
      expect(sms[0]!.body).toContain(policy.body.policyNumber)
    })

    it('serves the e-policy document to its owner and nobody else', async () => {
      const { token, authority } = await reachTheBank()
      await settle(authority, 'PAID')
      const { body } = await verify(authority)

      const doc = await request(http)
        .get(`${ctx.api}/policies/${body.policyId}/document`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
      expect(doc.headers['content-type']).toContain('text/html')
      expect(doc.headers['cache-control']).toContain('no-store')

      await request(http).get(`${ctx.api}/policies/${body.policyId}/document`).expect(401)
    })
  })

  /*
   * The property the whole design turns on. A callback is a message on an unreliable channel:
   * the browser retries it, the customer refreshes the result screen, a reconciliation job
   * replays it days later. Every one of those must land on the same single policy.
   */
  describe('replayed callback', () => {
    it('reports the first decision again instead of issuing twice', async () => {
      const { order, authority } = await reachTheBank()
      await settle(authority, 'PAID')

      const first = await verify(authority).expect(200)
      const second = await verify(authority).expect(200)
      const third = await verify(authority).expect(200)

      expect(second.body.policyId).toBe(first.body.policyId)
      expect(third.body.policyId).toBe(first.body.policyId)
      expect(second.body.refId).toBe(first.body.refId)
      expect(second.body.orderStatus).toBe(OrderStatus.ISSUED)

      await expect(ctx.db.policy.count({ where: { orderId: order.id } })).resolves.toBe(1)
      await expect(ctx.db.smsLog.count({ where: { template: 'POLICY_ISSUED' } })).resolves.toBe(1)
    })

    it('issues one policy when three callbacks arrive at once', async () => {
      const { order, authority } = await reachTheBank()
      await settle(authority, 'PAID')

      const results = await Promise.all([verify(authority), verify(authority), verify(authority)])

      // Every caller is told the payment succeeded — one of them claimed it, the others read
      // the claim rather than racing the gateway a second time.
      expect(results.map((r) => r.status)).toEqual([200, 200, 200])
      expect(results.every((r) => r.body.paymentStatus === PaymentStatus.SUCCEEDED)).toBe(true)

      /*
       * A loser may answer before the winner's issuance has committed, so `policyId: null` is a
       * legitimate reply here — «پرداخت شد، بیمه‌نامه در راه است», which is exactly the pending
       * branch of the callback screen. What must never happen is two *different* policies.
       */
      const issued = results.map((r) => r.body.policyId).filter(Boolean)
      expect(new Set(issued).size).toBe(1)
      await expect(ctx.db.policy.count({ where: { orderId: order.id } })).resolves.toBe(1)
      await expect(ctx.db.smsLog.count({ where: { template: 'POLICY_ISSUED' } })).resolves.toBe(1)

      // And a later reader always sees it, whatever the racing callbacks said at the time.
      const settled = await verify(authority).expect(200)
      expect(settled.body.policyId).toBe(issued[0])
      expect(settled.body.orderStatus).toBe(OrderStatus.ISSUED)
    })

    it('cannot be paid a second time once it is issued', async () => {
      const { token, order, authority } = await reachTheBank()
      await settle(authority, 'PAID')
      await verify(authority)

      const again = await startPayment(token, order.id).expect(409)
      expect(again.body.code).toBe('ORDER_ALREADY_PAID')
    })
  })

  /*
   * The customer's browser owns the callback query string. A gateway that believes `Status=OK`
   * hands free policies to anyone who can edit a URL, so this asserts the ledger wins.
   */
  describe('a callback the customer forged', () => {
    it('refuses an OK status the bank page never settled', async () => {
      const { order, authority } = await reachTheBank()

      const res = await verify(authority, 'OK').expect(200)
      expect(res.body.paymentStatus).toBe(PaymentStatus.FAILED)
      expect(res.body.policyId).toBeNull()
      expect(res.body.messageFa).not.toMatch(/\d/)

      await expect(ctx.db.policy.count({ where: { orderId: order.id } })).resolves.toBe(0)
    })

    it('refuses an OK status for a cancelled payment', async () => {
      const { authority } = await reachTheBank()
      await settle(authority, 'CANCELLED')

      const res = await verify(authority, 'OK').expect(200)
      expect(res.body.paymentStatus).toBe(PaymentStatus.FAILED)
      expect(res.body.messageFa).toContain('لغو')
    })

    it('404s an authority that does not exist', async () => {
      await verify('A0000000000000000000000000000000000').expect(404)
    })
  })

  describe('a declined card', () => {
    it('leaves the order payable and lets a second attempt succeed', async () => {
      const { token, order, authority } = await reachTheBank()

      await settle(authority, 'FAILED')
      const declined = await verify(authority, 'NOK').expect(200)
      expect(declined.body.orderStatus).toBe(OrderStatus.PAYMENT_FAILED)
      expect(declined.body.policyId).toBeNull()
      // The failure screen needs a route back to checkout, not a dead end.
      expect(declined.body.quoteOfferId).toBe(order.quoteOfferId)

      // A different card: a fresh attempt, its own authority, its own audit row.
      const retry = (await startPayment(token, order.id).expect(201)).body
      expect(retry.authority).not.toBe(authority)

      await settle(retry.authority, 'PAID')
      const paid = await verify(retry.authority).expect(200)
      expect(paid.body.orderStatus).toBe(OrderStatus.ISSUED)

      await expect(ctx.db.payment.count({ where: { orderId: order.id } })).resolves.toBe(2)
      await expect(ctx.db.policy.count({ where: { orderId: order.id } })).resolves.toBe(1)
    })

    it('keeps the dead authority dead after the retry succeeded', async () => {
      const { token, order, authority } = await reachTheBank()
      await settle(authority, 'FAILED')
      await verify(authority, 'NOK')

      const retry = (await startPayment(token, order.id).expect(201)).body
      await settle(retry.authority, 'PAID')
      await verify(retry.authority)

      // Replaying the *failed* authority must not touch the issued order.
      const replay = await verify(authority, 'OK').expect(200)
      expect(replay.body.paymentStatus).toBe(PaymentStatus.FAILED)
      await expect(ctx.db.policy.count({ where: { orderId: order.id } })).resolves.toBe(1)
    })
  })

  describe('order guards', () => {
    it('returns the same order for a replayed idempotency key', async () => {
      const token = await login()
      const q = await quote()
      const offer = q.offers.find((o: { isEligible: boolean }) => o.isEligible)
      const key = randomUUID()

      const first = await placeOrder(token, offer.id, key).expect(201)
      const second = await placeOrder(token, offer.id, key).expect(201)

      expect(second.body.id).toBe(first.body.id)
      await expect(ctx.db.order.count()).resolves.toBe(1)
    })

    it('refuses to pay an order that has expired', async () => {
      const token = await login()
      const q = await quote()
      const offer = q.offers.find((o: { isEligible: boolean }) => o.isEligible)
      const order = (await placeOrder(token, offer.id).expect(201)).body

      await ctx.db.order.update({
        where: { id: order.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      const res = await startPayment(token, order.id).expect(410)
      expect(res.body.code).toBe('ORDER_EXPIRED')
    })

    it('refuses an order built on an expired quote', async () => {
      const token = await login()
      const q = await quote()
      const offer = q.offers.find((o: { isEligible: boolean }) => o.isEligible)

      await ctx.db.quote.update({
        where: { id: q.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      const res = await placeOrder(token, offer.id).expect(410)
      expect(res.body.code).toBe('QUOTE_EXPIRED')
    })

    it('will not let one customer pay for an order that is not theirs', async () => {
      const { order } = await reachTheBank()

      await request(http)
        .post(`${ctx.api}/auth/otp/request`)
        .send({ mobile: '09121112222' })
        .expect(200)
      const other = await request(http)
        .post(`${ctx.api}/auth/otp/verify`)
        .send({ mobile: '09121112222', code: '1234' })
        .expect(200)

      await request(http)
        .post(`${ctx.api}/orders/${order.id}/pay`)
        .set('Authorization', `Bearer ${other.body.accessToken}`)
        .expect(403)
    })

    it('requires a session to order at all', async () => {
      const q = await quote()
      const offer = q.offers.find((o: { isEligible: boolean }) => o.isEligible)
      await request(http)
        .post(`${ctx.api}/orders`)
        .send({ quoteOfferId: offer.id, insured: INSURED, idempotencyKey: randomUUID() })
        .expect(401)
    })
  })
})
