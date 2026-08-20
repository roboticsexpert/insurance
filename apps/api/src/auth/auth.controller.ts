import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { getClientIp } from '../common/http/client-ip'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { AuthService } from './auth.service'
import { REFRESH_COOKIE_NAME } from './token.constants'
import {
  otpRequestSchema,
  otpVerifySchema,
  type AuthResponse,
  type OtpRequestDto,
  type OtpRequestResponse,
  type OtpVerifyDto,
} from './dto/auth.dto'
import { OtpService } from './otp.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly auth: AuthService,
  ) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: OtpRequestDto,
    @Req() req: Request,
  ): Promise<OtpRequestResponse> {
    return this.otp.request(body.mobile, getClientIp(req))
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyDto,
    @Req() req: Request,
    // passthrough keeps Nest's normal serialisation while letting us set the cookie.
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.auth.verifyOtpAndLogin(body.mobile, body.code, {
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
    }, res)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.auth.refresh(
      req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined,
      { ip: getClientIp(req), userAgent: req.headers['user-agent'] },
      res,
    )
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined, res)
  }
}
