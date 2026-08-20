import { Module } from '@nestjs/common'
import { ConsoleSmsSender } from './console-sms-sender'
import { NotificationsService } from './notifications.service'
import { SMS_SENDER } from './sms-sender'

/**
 * Only `console` exists today. When a real provider arrives it becomes another class here,
 * selected by `SMS_PROVIDER`; nothing else in the codebase changes.
 */
@Module({
  providers: [NotificationsService, { provide: SMS_SENDER, useClass: ConsoleSmsSender }],
  exports: [NotificationsService],
})
export class NotificationsModule {}
