import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Booking } from '@prisma/client';
import type { Queue } from 'bullmq';
import {
  BOOKINGS_REPOSITORY,
  BookingFilters,
  IBookingsRepository,
  PaginatedBookings,
} from './repositories/bookings-repository.interface';

export interface BookingAutoCancelJobPayload {
  bookingId: string;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @Inject(BOOKINGS_REPOSITORY)
    private readonly bookingsRepository: IBookingsRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('booking-auto-cancel')
    private readonly autoCancelQueue: Queue<BookingAutoCancelJobPayload>,
  ) {}

  async create(propertyId: string, userId: string): Promise<Booking> {
    const booking = await this.bookingsRepository.createWithPropertyLock(
      propertyId,
      userId,
    );

    if (!booking) {
      throw new ConflictException(
        'Property is not available for booking: it is either reserved or does not exist',
      );
    }

    this.eventEmitter.emit('booking.created', { bookingId: booking.id });

    return booking;
  }

  async findManyForUser(
    userId: string,
    filters: BookingFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedBookings> {
    return this.bookingsRepository.findManyByUser(userId, filters, page, limit);
  }

  async cancel(
    bookingId: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<void> {
    void currentUserId;
    void isAdmin;

    const booking = await this.bookingsRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'ACTIVE') {
      throw new ConflictException('Booking is not active');
    }

    await this.bookingsRepository.cancelWithPropertyRelease(
      bookingId,
      booking.propertyId,
    );

    if (booking.autoCancelJobId) {
      await this.removeAutoCancelJob(booking.autoCancelJobId);
    }
  }

  async expire(bookingId: string): Promise<void> {
    const booking = await this.bookingsRepository.findById(bookingId);

    if (!booking || booking.status !== 'ACTIVE') {
      return;
    }

    await this.bookingsRepository.expireWithPropertyRelease(
      bookingId,
      booking.propertyId,
    );
  }

  private async removeAutoCancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.autoCancelQueue.getJob(jobId);

      if (job) {
        await job.remove();
      }
    } catch (error) {
      this.logger.warn(
        `Failed to remove auto-cancel job ${jobId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
