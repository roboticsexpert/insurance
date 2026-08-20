import { forwardRef, Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { OrdersModule } from '../orders/orders.module'
import { RatingModule } from '../rating/rating.module'
import { PoliciesController } from './policies.controller'
import { PoliciesService } from './policies.service'

@Module({
  imports: [forwardRef(() => OrdersModule), RatingModule, NotificationsModule],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
