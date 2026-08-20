import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  BookingAutoCancelJobPayload,
  BookingsService,
} from '../bookings.service';

@Processor('booking-auto-cancel')
export class BookingAutoCancelProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingAutoCancelProcessor.name);

  constructor(private readonly bookingsService: BookingsService) {
    super();
  }

  async process(job: Job<BookingAutoCancelJobPayload>): Promise<void> {
    try {
      await this.bookingsService.expire(job.data.bookingId);
    } catch (error) {
      this.logger.error(
        `Failed to expire booking ${job.data.bookingId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
