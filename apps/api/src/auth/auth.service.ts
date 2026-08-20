import { Injectable } from '@nestjs/common'
import { AppException } from '../common/app.exception'
import type { Response } from 'express'
import { UsersService } from '../users/users.service'
import { toUserDto } from '../users/user.dto'
import type { AuthResponse } from './dto/auth.dto'
import { OtpService } from './otp.service'
import { TokenService } from './token.service'

export interface RequestMeta {
  ip: string
  userAgent?: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly otp: OtpService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  async verifyOtpAndLogin(
    mobile: string,
    code: string,
    meta: RequestMeta,
    res: Response,
  ): Promise<AuthResponse> {
    await this.otp.verify(mobile, code)

    const { user, isNew } = await this.users.findOrCreateByMobile(mobile)

    const accessToken = await this.tokens.signAccessToken(user)
    const refresh = await this.tokens.issueRefreshToken(user.id, {
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    this.tokens.setRefreshCookie(res, refresh.token, refresh.expiresAt)

    return { accessToken, user: toUserDto(user), isNewUser: isNew }
  }

  /** Exchanges the refresh cookie for a new access token, rotating the cookie as it goes. */
  async refresh(rawToken: string | undefined, meta: RequestMeta, res: Response): Promise<AuthResponse> {
    if (!rawToken) throw new AppException('REFRESH_TOKEN_INVALID')

    let rotated: Awaited<ReturnType<TokenService['rotateRefreshToken']>>
    try {
      rotated = await this.tokens.rotateRefreshToken(rawToken, {
        ip: meta.ip,
        userAgent: meta.userAgent,
      })
    } catch (error) {
      // A dead session should not leave a cookie behind that keeps failing on every request.
      this.tokens.clearRefreshCookie(res)
      throw error
    }

    const user = await this.users.findById(rotated.userId)
    if (!user) {
      this.tokens.clearRefreshCookie(res)
      throw new AppException('REFRESH_TOKEN_INVALID')
    }

    this.tokens.setRefreshCookie(res, rotated.issued.token, rotated.issued.expiresAt)
    const accessToken = await this.tokens.signAccessToken(user)

    return { accessToken, user: toUserDto(user), isNewUser: false }
  }

  /** Idempotent: logging out twice, or with no cookie at all, still succeeds. */
  async logout(rawToken: string | undefined, res: Response): Promise<void> {
    if (rawToken) await this.tokens.revokeByToken(rawToken)
    this.tokens.clearRefreshCookie(res)
  }
}
