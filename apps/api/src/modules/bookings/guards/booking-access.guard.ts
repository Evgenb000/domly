import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  BOOKINGS_REPOSITORY,
  BookingWithPropertyAndOwner,
  IBookingsRepository,
} from '../repositories/bookings-repository.interface';

interface BookingAccessRequest extends Request {
  user: { id: string; role: string };
  booking?: BookingWithPropertyAndOwner;
}

@Injectable()
export class BookingAccessGuard implements CanActivate {
  constructor(
    @Inject(BOOKINGS_REPOSITORY)
    private readonly bookingsRepository: IBookingsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<BookingAccessRequest>();
    const user = request.user;
    const bookingId = request.params.id as string;

    if (!bookingId) {
      throw new ForbiddenException('Booking id is required');
    }

    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    if (user.id !== booking.property.ownerId && user.id !== booking.userId) {
      throw new ForbiddenException(
        'You do not have permission to cancel this booking',
      );
    }

    request.booking = booking;
    return true;
  }
}
