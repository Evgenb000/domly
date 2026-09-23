import type { BookingStatus, Prisma } from '@prisma/client';

export const BOOKINGS_REPOSITORY = Symbol('BOOKINGS_REPOSITORY');

export type BookingWithPropertyAndOwner = Prisma.BookingGetPayload<{
  include: {
    property: {
      include: { owner: true; district: { include: { city: true } } };
    };
  };
}>;

export interface BookingFilters {
  status?: BookingStatus;
}

export interface PaginatedBookings {
  items: BookingWithPropertyAndOwner[];
  total: number;
}

export interface IBookingsRepository {
  createWithPropertyLock(
    propertyId: string,
    userId: string,
  ): Promise<BookingWithPropertyAndOwner | null>;
  findById(id: string): Promise<BookingWithPropertyAndOwner | null>;
  findManyByUser(
    userId: string,
    filters: BookingFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedBookings>;
  updateAutoCancelJobId(id: string, jobId: string): Promise<void>;
  cancelWithPropertyRelease(
    bookingId: string,
    propertyId: string,
  ): Promise<void>;
  expireWithPropertyRelease(
    bookingId: string,
    propertyId: string,
  ): Promise<void>;
}
