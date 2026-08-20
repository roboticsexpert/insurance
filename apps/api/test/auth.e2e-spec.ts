import request from 'supertest'
import type { App } from 'supertest/types'
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR_PER_MOBILE,
} from '../src/auth/otp.constants'
import { REFRESH_COOKIE_NAME } from '../src/auth/token.constants'
import { cookieFrom, createE2eApp, resetDatabase, type E2eContext } from './helpers/app'

const MOBILE = '09121110000'
const CANONICAL = '9121110000'

describe('auth (e2e)', () => {
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

  const requestCode = () =>
    request(http).post(`${ctx.api}/auth/otp/request`).send({ mobile: MOBILE })

  const verify = (code: string) =>
    request(http).post(`${ctx.api}/auth/otp/verify`).send({ mobile: MOBILE, code })

  /** Moves every challenge for the mobile back in time, to sidestep the 60s resend cooldown. */
  const backdate = (seconds: number) =>
    ctx.db.otpChallenge.updateMany({
      where: { mobile: CANONICAL },
      data: { createdAt: new Date(Date.now() - seconds * 1000) },
    })

  describe('happy path', () => {
    it('logs a new user in and creates their account', async () => {
      const requested = await requestCode().expect(200)
      expect(requested.body).toMatchObject({ expiresIn: 120, retryAfter: 60 })
      expect(requested.body.devCode).toMatch(/^\d{4}$/)

      const verified = await verify(requested.body.devCode).expect(200)
      expect(verified.body.isNewUser).toBe(true)
      expect(verified.body.user).toMatchObject({
        mobile: CANONICAL,
        isProfileComplete: false,
      })
      expect(verified.body.accessToken).toMatch(/^eyJ/)

      const cookie = cookieFrom(verified.headers['set-cookie'], REFRESH_COOKIE_NAME)
      expect(cookie).toMatch(/^[a-f0-9]{64}$/)

      await expect(ctx.db.user.count({ where: { mobile: CANONICAL } })).resolves.toBe(1)
    })

    it('reuses the account on a second login', async () => {
      const first = await requestCode()
      await verify(first.body.devCode).expect(200)

      await backdate(120)
      const second = await requestCode()
      const result = await verify(second.body.devCode).expect(200)

      expect(result.body.isNewUser).toBe(false)
      await expect(ctx.db.user.count()).resolves.toBe(1)
    })

    it('accepts the universal mock code', async () => {
      await requestCode()
      await verify('1234').expect(200)
    })

    it('reaches /me with the issued token, and refuses without it', async () => {
      const requested = await requestCode()
      const { body } = await verify(requested.body.devCode)

      await request(http).get(`${ctx.api}/me`).expect(401)
      const me = await request(http)
        .get(`${ctx.api}/me`)
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200)
      expect(me.body.mobile).toBe(CANONICAL)
    })
  })

  describe('wrong code', () => {
    it('rejects it without consuming the challenge', async () => {
      const requested = await requestCode()

      const failed = await verify('0000').expect(422)
      expect(failed.body.code).toBe('OTP_INVALID')

      // The real code still works afterwards.
      await verify(requested.body.devCode).expect(200)
    })

    it('never leaks whether the mobile has an account', async () => {
      const unknown = await request(http)
        .post(`${ctx.api}/auth/otp/request`)
        .send({ mobile: '09129999999' })
        .expect(200)

      const known = await requestCode().expect(200)

      expect(Object.keys(unknown.body).sort()).toEqual(Object.keys(known.body).sort())
    })
  })

  describe('expired code', () => {
    it('is refused once the TTL has passed', async () => {
      const requested = await requestCode()
      await ctx.db.otpChallenge.updateMany({
        where: { mobile: CANONICAL },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      const result = await verify(requested.body.devCode).expect(410)
      expect(result.body.code).toBe('OTP_EXPIRED')
    })

    it('is refused after being used once', async () => {
      const requested = await requestCode()
      await verify(requested.body.devCode).expect(200)
      await verify(requested.body.devCode).expect(410)
    })

    it('invalidates the previous code when a new one is issued', async () => {
      const first = await requestCode()
      await backdate(70)
      const second = await requestCode()

      await verify(first.body.devCode).expect(422)
      await verify(second.body.devCode).expect(200)
    })
  })

  describe('attempt lockout', () => {
    it('burns the challenge on the last wrong guess', async () => {
      const requested = await requestCode()

      for (let i = 1; i < OTP_MAX_ATTEMPTS; i++) {
        await verify('0000').expect(422)
      }
      const final = await verify('0000').expect(429)
      expect(final.body.code).toBe('OTP_ATTEMPTS_EXCEEDED')

      // Even the correct code is dead now.
      const after = await verify(requested.body.devCode).expect(410)
      expect(after.body.code).toBe('OTP_EXPIRED')
    })
  })

  describe('rate limits', () => {
    it('blocks a resend inside the cooldown, with the wait in Persian digits', async () => {
      await requestCode().expect(200)
      const blocked = await requestCode().expect(429)

      expect(blocked.body.code).toBe('OTP_TOO_SOON')
      expect(blocked.body.messageFa).toMatch(/[۰-۹]+ ثانیه/)
      expect(blocked.body.messageFa).not.toMatch(/\d/) // no Latin digits in user-facing copy
    })

    it('allows a resend once the cooldown has passed', async () => {
      await requestCode().expect(200)
      await backdate(61)
      await requestCode().expect(200)
    })

    it('caps requests per mobile per hour', async () => {
      for (let i = 0; i < OTP_MAX_PER_HOUR_PER_MOBILE; i++) {
        await requestCode().expect(200)
        await backdate(61)
      }
      const blocked = await requestCode().expect(429)
      expect(blocked.body.code).toBe('RATE_LIMITED')
    })
  })

  describe('refresh and logout', () => {
    const login = async (): Promise<string> => {
      const requested = await requestCode()
      const verified = await verify(requested.body.devCode)
      return cookieFrom(verified.headers['set-cookie'], REFRESH_COOKIE_NAME) as string
    }

    const refresh = (token: string) =>
      request(http).post(`${ctx.api}/auth/refresh`).set('Cookie', `${REFRESH_COOKIE_NAME}=${token}`)

    it('rotates the token and issues a fresh access token', async () => {
      const a = await login()
      const res = await refresh(a).expect(200)
      const b = cookieFrom(res.headers['set-cookie'], REFRESH_COOKIE_NAME)

      expect(b).toMatch(/^[a-f0-9]{64}$/)
      expect(b).not.toBe(a)
      expect(res.body.accessToken).toMatch(/^eyJ/)
    })

    // The security property worth guarding: a replay kills every descendant session.
    it('revokes the whole family when a rotated token is replayed', async () => {
      const a = await login()
      const b = cookieFrom((await refresh(a)).headers['set-cookie'], REFRESH_COOKIE_NAME) as string
      const c = cookieFrom((await refresh(b)).headers['set-cookie'], REFRESH_COOKIE_NAME) as string

      await refresh(a).expect(401)
      await refresh(c).expect(401)

      const tokens = await ctx.db.refreshToken.findMany()
      expect(tokens).toHaveLength(3)
      expect(tokens.every((t) => t.revokedAt !== null)).toBe(true)
    })

    it('clears the cookie when refresh fails', async () => {
      const res = await refresh('deadbeef').expect(401)
      expect(cookieFrom(res.headers['set-cookie'], REFRESH_COOKIE_NAME)).toBe('')
    })

    it('logs out idempotently and kills the session', async () => {
      const token = await login()
      await request(http)
        .post(`${ctx.api}/auth/logout`)
        .set('Cookie', `${REFRESH_COOKIE_NAME}=${token}`)
        .expect(204)

      await refresh(token).expect(401)
      await request(http).post(`${ctx.api}/auth/logout`).expect(204)
    })
  })

  describe('validation', () => {
    it('normalises every way a user might type their number', async () => {
      await request(http)
        .post(`${ctx.api}/auth/otp/request`)
        .send({ mobile: '۰۹۱۲۱۱۱۰۰۰۰' })
        .expect(200)

      // +98 form lands in the same bucket, so the cooldown applies.
      await request(http)
        .post(`${ctx.api}/auth/otp/request`)
        .send({ mobile: '+989121110000' })
        .expect(429)
    })

    it('returns field-level Persian errors', async () => {
      const res = await request(http)
        .post(`${ctx.api}/auth/otp/request`)
        .send({ mobile: '12345' })
        .expect(422)

      expect(res.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        fields: { mobile: 'شماره موبایل معتبر نیست' },
      })
      expect(res.body.requestId).toBeDefined()
    })
  })
})
