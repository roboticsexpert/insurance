import { forwardRef, Module } from '@nestjs/common'
import { ENV } from '../config/config.module'
import type { Env } from '../config/env'
import { PrismaService } from '../prisma/prisma.service'
import { MockGateway } from './gateways/mock.gateway'
import { MockGatewayController } from './mock-gateway.controller'
import { PaymentsController } from './payments.controller'
import { OrdersModule } from '../orders/orders.module'
import { PoliciesModule } from '../policies/policies.module'
import { PAYMENT_GATEWAY } from './payment-gateway'
import { PaymentsService } from './payments.service'

/**
 * One provider chooses the gateway. Adding a real IPG means another class implementing
 * `PaymentGateway` and one more branch here — nothing else in the codebase changes.
 */
@Module({
  imports: [forwardRef(() => OrdersModule), forwardRef(() => PoliciesModule)],
  controllers: [MockGatewayController, PaymentsController],
  providers: [
    MockGateway,
    PaymentsService,
    {
      provide: PAYMENT_GATEWAY,
      useFactory: (env: Env, prisma: PrismaService) => {
        switch (env.PAYMENT_GATEWAY) {
          case 'mock':
            return new MockGateway(prisma, env)
          default:
            throw new Error(`Unsupported PAYMENT_GATEWAY: ${String(env.PAYMENT_GATEWAY)}`)
        }
      },
      inject: [ENV, PrismaService],
    },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY, MockGateway],
})
export class PaymentsModule {}
