import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { loadEnv } from './config/env'

async function bootstrap(): Promise<void> {
  // Throws and takes the process down if anything is missing or malformed.
  const env = loadEnv()

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  app.use(helmet())
  app.use(cookieParser())
  // The mock bank page posts a plain HTML form, not JSON.
  app.use(express.urlencoded({ extended: false }))

  // Traffic arrives Cloudflare → Railway → here. Without this, express reports the proxy's
  // address as req.ip and every user lands in the same rate-limit bucket.
  app.set('trust proxy', true)

  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true, // the refresh token travels as an httpOnly cookie
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })

  // /health stays unversioned so probes never break on an API version bump.
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready', 'mock-gateway', 'mock-gateway/settle'],
  })
  app.enableShutdownHooks()

  await app.listen(env.PORT, '0.0.0.0')

  const logger = app.get(Logger)
  logger.log(
    `bimegold api listening on :${env.PORT} [${env.NODE_ENV}] · mock OTP ${env.AUTH_MOCK_OTP || 'disabled'}`,
  )
}

void bootstrap()
