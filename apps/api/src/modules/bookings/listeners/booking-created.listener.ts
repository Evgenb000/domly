import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';
import { TWENTY_FOUR_HOURS_MS } from '../../../common/constants/time.constants';
import { NotificationsService } from '../../notifications/notifications.service';
import { BookingAutoCancelJobPayload } from '../bookings.service';
import {
  BOOKINGS_REPOSITORY,
  IBookingsRepository,
} from '../repositories/bookings-repository.interface';

@Injectable()
export class BookingCreatedListener {
  private readonly logger = new Logger(BookingCreatedListener.name);

  constructor(
    @Inject(BOOKINGS_REPOSITORY)
    private readonly bookingsRepository: IBookingsRepository,
    @InjectQueue('booking-auto-cancel')
    private readonly autoCancelQueue: Queue<BookingAutoCancelJobPayload>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('booking.created')
  async handle(payload: { bookingId: string }): Promise<void> {
    const booking = await this.bookingsRepository.findById(payload.bookingId);

    if (!booking) {
      this.logger.warn(
        `Booking ${payload.bookingId} not found while handling booking.created event`,
      );
      return;
    }

    const owner = booking.property.owner;

    await this.notificationsService.queueEmail({
      type: 'BOOKING_CREATED',
      to: owner.email,
      ownerName: owner.name,
      propertyTitle: booking.property.title,
      bookingId: booking.id,
    });

    const job = await this.autoCancelQueue.add(
      'auto-cancel',
      { bookingId: booking.id },
      { delay: TWENTY_FOUR_HOURS_MS },
    );

    if (!job.id) {
      this.logger.warn(
        `Auto-cancel job for booking ${booking.id} was created without an id — autoCancelJobId not saved`,
      );
      return;
    }

    await this.bookingsRepository.updateAutoCancelJobId(booking.id, job.id);
  }
}
