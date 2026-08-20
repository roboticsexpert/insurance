import { Global, Module } from '@nestjs/common'
import { loadEnv, type Env } from './env'

export const ENV = Symbol('ENV')

/**
 * Deliberately not `@nestjs/config`: a validated object provided once is fully typed and
 * needs no `get('KEY')` string lookups.
 */
@Global()
@Module({
  providers: [{ provide: ENV, useFactory: (): Env => loadEnv() }],
  exports: [ENV],
})
export class ConfigModule {}
