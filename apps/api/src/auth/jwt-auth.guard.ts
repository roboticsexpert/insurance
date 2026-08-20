import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { AppException } from '../common/app.exception'
import { ENV } from '../config/config.module'
import type { Env } from '../config/env'
import type { AuthenticatedUser } from './authenticated-user'
import type { AccessTokenPayload } from './token.service'

const bearerToken = (req: Request): string | null => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token.length > 0 ? token : null
}

/**
 * Verifies the access token's signature only — it does not load the user.
 *
 * That means a deleted or blocked account keeps working until its access token expires, which
 * is at most 15 minutes. The trade is one fewer database round trip on every authenticated
 * request. If blocking ever needs to be immediate, this is the place to add the lookup.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const token = bearerToken(req)
    if (!token) throw new AppException('UNAUTHORIZED')

    req.user = await this.verify(token)
    return true
  }

  protected async verify(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.env.JWT_ACCESS_SECRET,
      })
      return { userId: payload.sub, mobile: payload.mobile }
    } catch {
      // Expired, tampered with, or signed by something else — the client cannot tell them
      // apart and does not need to. It refreshes and retries either way.
      throw new AppException('UNAUTHORIZED')
    }
  }
}

/**
 * Attaches the user when a valid token is present and lets the request through when it is not.
 *
 * This is what makes quoting work before login: the wizard and the price comparison run
 * anonymously, and the quote attaches to the account if one happens to be signed in.
 */
@Injectable()
export class OptionalJwtGuard extends JwtAuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const token = bearerToken(req)
    if (!token) return true

    try {
      req.user = await this.verify(token)
    } catch {
      // A bad token is treated as no token — never as a reason to reject the request.
    }
    return true
  }
}
