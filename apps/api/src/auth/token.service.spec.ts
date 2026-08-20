import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { createHash } from 'node:crypto'
import { ENV } from '../config/config.module'
import { PrismaService } from '../prisma/prisma.service'
import { hashToken, TokenService } from './token.service'

const sha = (v: string) => createHash('sha256').update(v).digest('hex')
const RAW = 'a'.repeat(64)

describe('TokenService refresh rotation', () => {
  const findFirst = jest.fn()
  const create = jest.fn()
  const updateMany = jest.fn()
  let service: TokenService

  const build = async (nodeEnv = 'development', cookieDomain = '') => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        JwtService,
        { provide: PrismaService, useValue: { refreshToken: { findFirst, create, updateMany } } },
        {
          provide: ENV,
          useValue: {
            NODE_ENV: nodeEnv,
            COOKIE_DOMAIN: cookieDomain,
            JWT_ACCESS_SECRET: 's'.repeat(32),
          },
        },
      ],
    })
      .setLogger({ log() {}, error() {}, warn() {}, debug() {}, verbose() {} })
      .compile()
    return moduleRef.get(TokenService)
  }

  const live = (over: Record<string, unknown> = {}) => ({
    id: 'rt1',
    userId: 'u1',
    family: 'fam1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    ...over,
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    create.mockResolvedValue({})
    updateMany.mockResolvedValue({ count: 1 })
    service = await build()
  })

  it('hashes the token with sha256 before looking it up', async () => {
    findFirst.mockResolvedValue(live())
    await service.rotateRefreshToken(RAW, {})
    expect(findFirst).toHaveBeenCalledWith({ where: { tokenHash: sha(RAW) } })
    expect(hashToken(RAW)).toBe(sha(RAW))
  })

  it('issues a new token inside the same family', async () => {
    findFirst.mockResolvedValue(live())
    const { userId, issued } = await service.rotateRefreshToken(RAW, { ip: '1.1.1.1' })

    expect(userId).toBe('u1')
    expect(issued.family).toBe('fam1')
    expect(issued.token).toMatch(/^[a-f0-9]{64}$/)
    expect(issued.token).not.toBe(RAW)
    // What lands in the row is the hash, never the token itself.
    expect(create.mock.calls[0][0].data.tokenHash).toBe(sha(issued.token))
  })

  it('claims the old token atomically, guarded on it still being live', async () => {
    findFirst.mockResolvedValue(live())
    await service.rotateRefreshToken(RAW, {})
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'rt1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('rejects an unknown token', async () => {
    findFirst.mockResolvedValue(null)
    await expect(service.rotateRefreshToken(RAW, {})).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALID',
    })
  })

  it('rejects an expired token', async () => {
    findFirst.mockResolvedValue(live({ expiresAt: new Date(Date.now() - 1000) }))
    await expect(service.rotateRefreshToken(RAW, {})).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALID',
    })
    expect(create).not.toHaveBeenCalled()
  })

  // The core of the design: a replayed token means someone holds a copy they should not.
  it('revokes the whole family when an already-rotated token is replayed', async () => {
    findFirst.mockResolvedValue(live({ revokedAt: new Date() }))

    await expect(service.rotateRefreshToken(RAW, {})).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALID',
    })
    expect(updateMany).toHaveBeenCalledWith({
      where: { family: 'fam1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    expect(create).not.toHaveBeenCalled()
  })

  // Two tabs refreshing at once must not both win.
  it('treats a lost rotation race as a replay and kills the family', async () => {
    findFirst.mockResolvedValue(live())
    updateMany.mockResolvedValueOnce({ count: 0 })

    await expect(service.rotateRefreshToken(RAW, {})).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALID',
    })
    expect(updateMany).toHaveBeenLastCalledWith({
      where: { family: 'fam1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('logout revokes the family behind the presented token', async () => {
    findFirst.mockResolvedValue({ family: 'fam1' })
    await service.revokeByToken(RAW)
    expect(updateMany).toHaveBeenCalledWith({
      where: { family: 'fam1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('logout with an unknown token is a no-op, not an error', async () => {
    findFirst.mockResolvedValue(null)
    await expect(service.revokeByToken(RAW)).resolves.toBeUndefined()
    expect(updateMany).not.toHaveBeenCalled()
  })

  describe('cookie options', () => {
    const capture = () => {
      const cookie = jest.fn()
      return { res: { cookie, clearCookie: jest.fn() } as never, cookie }
    }

    it('is not Secure in development and carries no domain', async () => {
      const { res, cookie } = capture()
      service.setRefreshCookie(res, 'tok', new Date())
      expect(cookie.mock.calls[0][2]).toMatchObject({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth',
      })
      expect(cookie.mock.calls[0][2]).not.toHaveProperty('domain')
    })

    it('is Secure and domain-scoped in production', async () => {
      const prod = await build('production', '.bime247.com')
      const { res, cookie } = capture()
      prod.setRefreshCookie(res, 'tok', new Date())
      expect(cookie.mock.calls[0][2]).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: '.bime247.com',
      })
    })
  })
})
