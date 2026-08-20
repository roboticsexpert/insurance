import { Test } from '@nestjs/testing'
import * as argon2 from 'argon2'
import { AppException } from '../common/app.exception'
import { ENV } from '../config/config.module'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'
import { ARGON2_OPTIONS, OTP_MAX_ATTEMPTS } from './otp.constants'
import { OtpService } from './otp.service'

const MOBILE = '9123456789'
const REAL_CODE = '4821'

describe('OtpService.verify', () => {
  const findFirst = jest.fn()
  const update = jest.fn()
  let realHash: string

  beforeAll(async () => {
    realHash = await argon2.hash(REAL_CODE, ARGON2_OPTIONS)
  })

  const build = async (mockOtp = '1234') => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: { otpChallenge: { findFirst, update } } },
        { provide: NotificationsService, useValue: { send: jest.fn() } },
        { provide: ENV, useValue: { NODE_ENV: 'development', AUTH_MOCK_OTP: mockOtp } },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    return moduleRef.get(OtpService)
  }

  const activeChallenge = (over: Record<string, unknown> = {}) => ({
    id: 'ch1',
    codeHash: realHash,
    attempts: 0,
    expiresAt: new Date(Date.now() + 60_000),
    ...over,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    update.mockResolvedValue({ attempts: 1 })
  })

  it('accepts the real code and consumes the challenge', async () => {
    findFirst.mockResolvedValue(activeChallenge())
    const service = await build()

    await expect(service.verify(MOBILE, REAL_CODE)).resolves.toBeUndefined()
    expect(update).toHaveBeenCalledWith({
      where: { id: 'ch1' },
      data: { consumedAt: expect.any(Date) },
    })
  })

  it('accepts the universal mock code', async () => {
    findFirst.mockResolvedValue(activeChallenge())
    const service = await build('1234')
    await expect(service.verify(MOBILE, '1234')).resolves.toBeUndefined()
  })

  it('rejects the mock code once the shortcut is disabled', async () => {
    findFirst.mockResolvedValue(activeChallenge())
    const service = await build('')
    await expect(service.verify(MOBILE, '1234')).rejects.toMatchObject({ code: 'OTP_INVALID' })
  })

  // The mock must not be a master key: without a requested code there is nothing to verify,
  // which keeps it behind the same rate limits as a real login.
  it('refuses the mock code when no challenge was ever requested', async () => {
    findFirst.mockResolvedValue(null)
    const service = await build('1234')
    await expect(service.verify(MOBILE, '1234')).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
  })

  it('rejects and consumes an expired challenge', async () => {
    findFirst.mockResolvedValue(activeChallenge({ expiresAt: new Date(Date.now() - 1000) }))
    const service = await build()

    await expect(service.verify(MOBILE, REAL_CODE)).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'ch1' },
      data: { consumedAt: expect.any(Date) },
    })
  })

  it('counts a wrong guess without consuming the challenge', async () => {
    findFirst.mockResolvedValue(activeChallenge())
    update.mockResolvedValue({ attempts: 2 })
    const service = await build()

    await expect(service.verify(MOBILE, '0000')).rejects.toMatchObject({ code: 'OTP_INVALID' })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'ch1' },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    })
  })

  it('burns the challenge on the last wrong guess', async () => {
    findFirst.mockResolvedValue(activeChallenge({ attempts: OTP_MAX_ATTEMPTS - 1 }))
    update.mockResolvedValue({ attempts: OTP_MAX_ATTEMPTS })
    const service = await build()

    const error = await service.verify(MOBILE, '0000').catch((e: AppException) => e)
    expect((error as AppException).code).toBe('OTP_ATTEMPTS_EXCEEDED')
    expect(update).toHaveBeenLastCalledWith({
      where: { id: 'ch1' },
      data: { consumedAt: expect.any(Date) },
    })
  })

  it('refuses an already-exhausted challenge outright', async () => {
    findFirst.mockResolvedValue(activeChallenge({ attempts: OTP_MAX_ATTEMPTS }))
    const service = await build()
    await expect(service.verify(MOBILE, REAL_CODE)).rejects.toMatchObject({
      code: 'OTP_ATTEMPTS_EXCEEDED',
    })
  })

  it('only ever considers the newest unconsumed challenge', async () => {
    findFirst.mockResolvedValue(activeChallenge())
    const service = await build()
    await service.verify(MOBILE, REAL_CODE)

    expect(findFirst).toHaveBeenCalledWith({
      where: { mobile: MOBILE, consumedAt: null, purpose: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
    })
  })
})
