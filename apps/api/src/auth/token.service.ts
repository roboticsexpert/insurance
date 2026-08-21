import { Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { User } from '@prisma/client'
import type { CookieOptions, Response } from 'express'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { AppException } from '../common/app.exception'
import { ENV } from '../config/config.module'
import type { Env } from '../config/env'
import { PrismaService } from '../prisma/prisma.service'
import {
  ACCESS_TOKEN_TTL,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_DAYS,
} from './token.constants'

export interface AccessTokenPayload {
  sub: string
  mobile: string
}

export interface IssuedRefreshToken {
  token: string
  family: string
  expiresAt: Date
}

const DAY_MS = 86_400_000

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  signAccessToken(user: Pick<User, 'id' | 'mobile'>): Promise<string> {
    const payload: AccessTokenPayload = { sub: user.id, mobile: user.mobile }
    return this.jwt.signAsync(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: ACCESS_TOKEN_TTL,
    })
  }

  /**
   * Refresh tokens are 256 bits of randomness, so they are hashed with SHA-256 rather than
   * argon2. Argon2 exists to make *guessable* secrets expensive; against a value with this much
   * entropy it buys nothing and would put ~50 ms on every token refresh.
   */
  async issueRefreshToken(
    userId: string,
    meta: { userAgent?: string; ip?: string; family?: string },
  ): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('hex')
    const family = meta.family ?? randomUUID()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * DAY_MS)

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        family,
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      },
    })

    return { token, family, expiresAt }
  }

  /**
   * Exchanges a refresh token for a fresh one in the same family.
   *
   * Rotation means a token is single-use. If one is presented twice, either the user's copy was
   * stolen and replayed or the thief's copy was — and there is no way to tell which. The only
   * safe response is to end every session descended from that login, so the whole family is
   * revoked and both parties are forced to log in again.
   */
  async rotateRefreshToken(
    rawToken: string,
    meta: { userAgent?: string; ip?: string },
  ): Promise<{ userId: string; issued: IssuedRefreshToken }> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashToken(rawToken) },
    })

    if (!stored) throw new AppException('REFRESH_TOKEN_INVALID')

    if (stored.revokedAt) {
      this.logger.warn(
        { userId: stored.userId, family: stored.family },
        'Refresh token reuse detected — revoking family',
      )
      await this.revokeFamily(stored.family)
      throw new AppException('REFRESH_TOKEN_INVALID')
    }

    if (stored.expiresAt <= new Date()) throw new AppException('REFRESH_TOKEN_INVALID')

    /*
     * Claim the token atomically. Two concurrent refreshes both read revokedAt = null, so
     * without this guard both would rotate and leave two live tokens in one family. Whoever
     * loses the race updates zero rows and is treated as a replay.
     */
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    if (claimed.count !== 1) {
      await this.revokeFamily(stored.family)
      throw new AppException('REFRESH_TOKEN_INVALID')
    }

    const issued = await this.issueRefreshToken(stored.userId, { ...meta, family: stored.family })
    return { userId: stored.userId, issued }
  }

  /** Ends every session descended from one login. */
  async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  /** Logout: the presented token identifies the family to end. Unknown tokens are a no-op. */
  async revokeByToken(rawToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashToken(rawToken) },
      select: { family: true },
    })
    if (stored) await this.revokeFamily(stored.family)
  }

  setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_COOKIE_NAME, token, this.cookieOptions(expiresAt))
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions())
  }

  private cookieOptions(expires?: Date): CookieOptions {
    const isProd = this.env.NODE_ENV === 'production'
    return {
      httpOnly: true,
      secure: isProd,
      /*
       * `lax` rather than `none`: app.bimegold.com and api.bimegold.com share the registrable
       * domain bimegold.com, so this is same-site despite being a different origin. That keeps
       * the cookie working as browsers tighten third-party cookie rules.
       */
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      ...(this.env.COOKIE_DOMAIN ? { domain: this.env.COOKIE_DOMAIN } : {}),
      ...(expires ? { expires } : {}),
    }
  }
}

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')
