import { Module } from '@nestjs/common';
import { BullMqInfrastructureModule } from '../../infrastructure/bullmq/bullmq.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsService } from './bookings.service';
import { BookingCreatedListener } from './listeners/booking-created.listener';
import { BookingAutoCancelProcessor } from './processors/booking-auto-cancel.processor';
import { BOOKINGS_REPOSITORY } from './repositories/bookings-repository.interface';
import { BookingsRepository } from './repositories/bookings.repository';

@Module({
  imports: [BullMqInfrastructureModule, NotificationsModule],
  providers: [
    BookingsService,
    BookingCreatedListener,
    BookingAutoCancelProcessor,
    { provide: BOOKINGS_REPOSITORY, useClass: BookingsRepository },
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
