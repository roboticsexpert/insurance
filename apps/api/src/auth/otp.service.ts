import { Inject, Injectable, Logger } from '@nestjs/common'
import * as argon2 from 'argon2'
import { randomInt } from 'node:crypto'
import { AppException } from '../common/app.exception'
import { toPersianDigits } from '../common/fa'
import { ENV } from '../config/config.module'
import type { Env } from '../config/env'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'
import type { OtpRequestResponse } from './dto/auth.dto'
import {
  ARGON2_OPTIONS,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR_PER_IP,
  OTP_MAX_PER_HOUR_PER_MOBILE,
  OTP_RESEND_SECONDS,
  OTP_TTL_SECONDS,
} from './otp.constants'

const HOUR_MS = 3_600_000

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Issues a login code.
   *
   * Deliberately does **not** look up the user first: the response is byte-identical whether
   * the number has an account or not, so this endpoint cannot be used to enumerate customers.
   * The `User` row is created at verify time instead, which also keeps spam from filling the
   * table with accounts that never log in.
   */
  async request(mobile: string, ip: string): Promise<OtpRequestResponse> {
    const now = new Date()
    await this.enforceLimits(mobile, ip, now)

    const code = this.generateCode()
    const codeHash = await argon2.hash(code, ARGON2_OPTIONS)
    const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000)

    // Only the newest code may work. Without this, every code issued inside the TTL window
    // stays valid at once and the effective guess budget multiplies.
    await this.prisma.$transaction([
      this.prisma.otpChallenge.updateMany({
        where: { mobile, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.otpChallenge.create({
        data: { mobile, codeHash, expiresAt, ip, purpose: 'LOGIN' },
      }),
    ])

    await this.notifications.send(mobile, 'OTP_LOGIN', { code })

    return {
      expiresIn: OTP_TTL_SECONDS,
      retryAfter: OTP_RESEND_SECONDS,
      // Saves a developer from digging through server logs. Guarded on NODE_ENV rather than on
      // AUTH_MOCK_OTP, because returning a live code over the wire in production is far worse
      // than the universal-code shortcut it would otherwise ride along with.
      ...(this.env.NODE_ENV === 'production' ? {} : { devCode: code }),
    }
  }

  /**
   * Consumes a code. Throws unless it matches; returns nothing on success.
   *
   * An active challenge is required even when the universal mock code is enabled — otherwise
   * `1234` alone would log anyone in as anyone, with no rate limit in front of it. Requiring
   * the request step keeps the mock behind the same throttle ladder as a real code.
   */
  async verify(mobile: string, code: string): Promise<void> {
    const now = new Date()

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { mobile, consumedAt: null, purpose: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
    })

    if (!challenge) throw new AppException('OTP_EXPIRED')

    if (challenge.expiresAt <= now) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: now },
      })
      throw new AppException('OTP_EXPIRED')
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await this.burn(challenge.id, now)
      throw new AppException('OTP_ATTEMPTS_EXCEEDED')
    }

    const matches = (await argon2.verify(challenge.codeHash, code)) || this.matchesMockCode(code)

    if (!matches) {
      const { attempts } = await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      })

      // Burn on the last wrong guess rather than waiting for one more request.
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.burn(challenge.id, now)
        throw new AppException('OTP_ATTEMPTS_EXCEEDED')
      }
      throw new AppException('OTP_INVALID')
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now },
    })
  }

  /** `AUTH_MOCK_OTP` is empty in any environment where the shortcut is off. */
  private matchesMockCode(code: string): boolean {
    return this.env.AUTH_MOCK_OTP !== '' && code === this.env.AUTH_MOCK_OTP
  }

  private burn(id: string, now: Date): Promise<unknown> {
    return this.prisma.otpChallenge.update({ where: { id }, data: { consumedAt: now } })
  }

  private async enforceLimits(mobile: string, ip: string, now: Date): Promise<void> {
    const since = new Date(now.getTime() - HOUR_MS)

    const [recentForMobile, countForIp] = await Promise.all([
      this.prisma.otpChallenge.findMany({
        where: { mobile, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.otpChallenge.count({ where: { ip, createdAt: { gte: since } } }),
    ])

    const last = recentForMobile[0]
    if (last) {
      const elapsed = Math.floor((now.getTime() - last.createdAt.getTime()) / 1000)
      if (elapsed < OTP_RESEND_SECONDS) {
        throw new AppException('OTP_TOO_SOON', {
          messageFa: `برای دریافت کد جدید ${toPersianDigits(OTP_RESEND_SECONDS - elapsed)} ثانیه صبر کنید.`,
        })
      }
    }

    if (recentForMobile.length >= OTP_MAX_PER_HOUR_PER_MOBILE) {
      throw new AppException('RATE_LIMITED', {
        messageFa: 'تعداد درخواست کد برای این شماره زیاد بوده است. یک ساعت دیگر تلاش کنید.',
      })
    }

    if (countForIp >= OTP_MAX_PER_HOUR_PER_IP) {
      this.logger.warn({ ip }, 'OTP request blocked by per-IP hourly limit')
      throw new AppException('RATE_LIMITED')
    }
  }

  /** Uniform across all 10,000 values, leading zeros preserved. */
  private generateCode(): string {
    return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
  }
}
