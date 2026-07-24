import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailFactory } from './factories/email.factory';
import { NotificationsService } from './notifications.service';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'emails' })],
  providers: [NotificationsService, EmailFactory, EmailProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
