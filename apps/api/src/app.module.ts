import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { randomUUID } from 'node:crypto'
import { AuthModule } from './auth/auth.module'
import { CatalogModule } from './catalog/catalog.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ConfigModule } from './config/config.module'
import { loadEnv } from './config/env'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'
import { OrdersModule } from './orders/orders.module'
import { PoliciesModule } from './policies/policies.module'
import { QuotesModule } from './quotes/quotes.module'
import { RatingModule } from './rating/rating.module'
import { UsersModule } from './users/users.module'
import { VehiclesModule } from './vehicles/vehicles.module'

const env = loadEnv()

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID()
          res.setHeader('x-request-id', id)
          return id
        },
        // Health checks would otherwise dominate the log.
        autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'req.body.code',
            'req.body.mobile',
            'req.body.nationalCode',
          ],
          censor: '[redacted]',
        },
        transport:
          env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } }
            : undefined,
      },
    }),
    // Baseline ceiling for every route. Auth endpoints add their own tighter limits.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    HealthModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    CatalogModule,
    RatingModule,
    QuotesModule,
    OrdersModule,
    PoliciesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
