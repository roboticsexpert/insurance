import { Test } from '@nestjs/testing'
import * as argon2 from 'argon2'
import { AppException } from '../common/app.exception'
import { ENV } from '../config/config.module'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'
import { OTP_MAX_PER_HOUR_PER_IP, OTP_MAX_PER_HOUR_PER_MOBILE } from './otp.constants'
import { OtpService } from './otp.service'

const MOBILE = '9123456789'
const IP = '5.5.5.5'

describe('OtpService.request', () => {
  const findMany = jest.fn()
  const count = jest.fn()
  const create = jest.fn()
  const updateMany = jest.fn()
  const $transaction = jest.fn()
  const send = jest.fn()

  const build = async (nodeEnv: 'development' | 'production' = 'development') => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: { otpChallenge: { findMany, count, create, updateMany }, $transaction },
        },
        { provide: NotificationsService, useValue: { send } },
        { provide: ENV, useValue: { NODE_ENV: nodeEnv } },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    return moduleRef.get(OtpService)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    findMany.mockResolvedValue([])
    count.mockResolvedValue(0)
    create.mockReturnValue('create-op')
    updateMany.mockReturnValue('update-op')
    $transaction.mockResolvedValue([])
    send.mockResolvedValue(undefined)
  })

  it('issues a code, hashes it, and sends it', async () => {
    const service = await build()
    const result = await service.request(MOBILE, IP)

    expect(result.expiresIn).toBe(120)
    expect(result.retryAfter).toBe(60)

    const created = create.mock.calls[0][0].data
    expect(created.mobile).toBe(MOBILE)
    expect(created.ip).toBe(IP)
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now())

    // The plaintext must never reach the row.
    expect(created.codeHash).toMatch(/^\$argon2id\$/)
    expect(created.codeHash).not.toContain(result.devCode)
    await expect(argon2.verify(created.codeHash, result.devCode as string)).resolves.toBe(true)

    expect(send).toHaveBeenCalledWith(MOBILE, 'OTP_LOGIN', { code: result.devCode })
  })

  it('generates a 4-digit code, preserving leading zeros', async () => {
    const service = await build()
    for (let i = 0; i < 40; i++) {
      const { devCode } = await service.request(MOBILE, IP)
      expect(devCode).toMatch(/^\d{4}$/)
    }
  })

  it('invalidates older unconsumed challenges so only the newest code works', async () => {
    const service = await build()
    await service.request(MOBILE, IP)

    expect(updateMany).toHaveBeenCalledWith({
      where: { mobile: MOBILE, consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    })
    // Both writes go through one transaction — never one without the other.
    expect($transaction).toHaveBeenCalledWith(['update-op', 'create-op'])
  })

  it('never returns the code in production', async () => {
    const service = await build('production')
    const result = await service.request(MOBILE, IP)
    expect(result).not.toHaveProperty('devCode')
  })

  // Any number a user reads must be in Persian digits — this is user-facing copy, not a log.
  it('rejects a resend inside the cooldown and says how long is left, in Persian digits', async () => {
    findMany.mockResolvedValue([{ createdAt: new Date(Date.now() - 18_000) }])
    const service = await build()

    await expect(service.request(MOBILE, IP)).rejects.toMatchObject({
      code: 'OTP_TOO_SOON',
      message: expect.stringContaining('۴۲ ثانیه'),
    })
    expect(create).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('allows a resend once the cooldown has passed', async () => {
    findMany.mockResolvedValue([{ createdAt: new Date(Date.now() - 61_000) }])
    const service = await build()
    await expect(service.request(MOBILE, IP)).resolves.toMatchObject({ expiresIn: 120 })
  })

  it('caps requests per mobile per hour', async () => {
    findMany.mockResolvedValue(
      Array.from({ length: OTP_MAX_PER_HOUR_PER_MOBILE }, () => ({
        createdAt: new Date(Date.now() - 300_000),
      })),
    )
    const service = await build()
    const error = await service.request(MOBILE, IP).catch((e: AppException) => e)
    expect(error).toBeInstanceOf(AppException)
    expect((error as AppException).code).toBe('RATE_LIMITED')
    expect(create).not.toHaveBeenCalled()
  })

  it('caps requests per IP per hour, across different mobiles', async () => {
    count.mockResolvedValue(OTP_MAX_PER_HOUR_PER_IP)
    const service = await build()
    await expect(service.request(MOBILE, IP)).rejects.toMatchObject({ code: 'RATE_LIMITED' })
    expect(create).not.toHaveBeenCalled()
  })

  it('does not look the user up, so the endpoint cannot enumerate accounts', async () => {
    const service = await build()
    await service.request(MOBILE, IP)
    // Only otpChallenge is touched — no user query of any kind.
    expect(findMany).toHaveBeenCalledTimes(1)
    expect(count).toHaveBeenCalledTimes(1)
  })
})
