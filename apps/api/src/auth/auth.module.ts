import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { NotificationsModule } from '../notifications/notifications.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard, OptionalJwtGuard } from './jwt-auth.guard'
import { OtpService } from './otp.service'
import { TokenService } from './token.service'

// Secrets are passed per-call in TokenService, so the module needs no async registration.
@Module({
  imports: [NotificationsModule, UsersModule, JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [OtpService, AuthService, TokenService, JwtAuthGuard, OptionalJwtGuard],
  exports: [OtpService, TokenService, JwtAuthGuard, OptionalJwtGuard],
})
export class AuthModule {}
