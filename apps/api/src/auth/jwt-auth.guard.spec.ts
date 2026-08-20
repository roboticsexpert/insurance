import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import type { ExecutionContext } from '@nestjs/common'
import { ENV } from '../config/config.module'
import { JwtAuthGuard, OptionalJwtGuard } from './jwt-auth.guard'

const SECRET = 's'.repeat(32)

const contextWith = (headers: Record<string, string>) => {
  const req: Record<string, unknown> = { headers }
  return {
    ctx: { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext,
    req,
  }
}

describe('JWT guards', () => {
  let jwt: JwtService
  let guard: JwtAuthGuard
  let optional: OptionalJwtGuard

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        OptionalJwtGuard,
        JwtService,
        { provide: ENV, useValue: { JWT_ACCESS_SECRET: SECRET } },
      ],
    }).compile()

    jwt = moduleRef.get(JwtService)
    guard = moduleRef.get(JwtAuthGuard)
    optional = moduleRef.get(OptionalJwtGuard)
  })

  const sign = (payload: object, opts: object = {}) =>
    jwt.signAsync(payload, { secret: SECRET, expiresIn: '15m', ...opts })

  describe('JwtAuthGuard', () => {
    it('attaches the user from a valid token', async () => {
      const token = await sign({ sub: 'u1', mobile: '9123456789' })
      const { ctx, req } = contextWith({ authorization: `Bearer ${token}` })

      await expect(guard.canActivate(ctx)).resolves.toBe(true)
      expect(req.user).toEqual({ userId: 'u1', mobile: '9123456789' })
    })

    it.each([
      ['no header', {}],
      ['wrong scheme', { authorization: 'Basic abc' }],
      ['empty bearer', { authorization: 'Bearer ' }],
    ])('rejects when there is %s', async (_label, headers) => {
      const { ctx } = contextWith(headers as Record<string, string>)
      await expect(guard.canActivate(ctx)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    })

    it('rejects a token signed with a different secret', async () => {
      const token = await jwt.signAsync({ sub: 'u1' }, { secret: 'x'.repeat(32) })
      const { ctx } = contextWith({ authorization: `Bearer ${token}` })
      await expect(guard.canActivate(ctx)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    })

    it('rejects an expired token', async () => {
      const token = await sign({ sub: 'u1', mobile: '9123456789' }, { expiresIn: '-1s' })
      const { ctx } = contextWith({ authorization: `Bearer ${token}` })
      await expect(guard.canActivate(ctx)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    })
  })

  describe('OptionalJwtGuard', () => {
    // This is what lets the quote wizard run before login.
    it('lets an anonymous request through with no user attached', async () => {
      const { ctx, req } = contextWith({})
      await expect(optional.canActivate(ctx)).resolves.toBe(true)
      expect(req.user).toBeUndefined()
    })

    it('attaches the user when the token is valid', async () => {
      const token = await sign({ sub: 'u9', mobile: '9351112233' })
      const { ctx, req } = contextWith({ authorization: `Bearer ${token}` })
      await expect(optional.canActivate(ctx)).resolves.toBe(true)
      expect(req.user).toEqual({ userId: 'u9', mobile: '9351112233' })
    })

    // A stale token in a long-open tab must not break anonymous quoting.
    it('treats an invalid token as no token rather than rejecting', async () => {
      const token = await sign({ sub: 'u1', mobile: '9123456789' }, { expiresIn: '-1s' })
      const { ctx, req } = contextWith({ authorization: `Bearer ${token}` })
      await expect(optional.canActivate(ctx)).resolves.toBe(true)
      expect(req.user).toBeUndefined()
    })
  })
})
