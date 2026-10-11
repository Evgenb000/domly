import type { BookingStatus, Prisma, PropertyStatus } from '@prisma/client';

export const BOOKINGS_REPOSITORY = Symbol('BOOKINGS_REPOSITORY');

export type BookingWithPropertyAndOwner = Prisma.BookingGetPayload<{
  include: {
    property: {
      include: {
        owner: { select: { name: true; role: true; email: true } };
        district: { include: { city: true } };
      };
    };
  };
}>;

export type PropertyBookingPreconditions = {
  id: string;
  ownerId: string;
  status: PropertyStatus;
};

export interface BookingFilters {
  status?: BookingStatus;
}

export interface PaginatedBookings {
  items: BookingWithPropertyAndOwner[];
  total: number;
}

export interface IBookingsRepository {
  findPropertyForBooking(
    propertyId: string,
  ): Promise<PropertyBookingPreconditions | null>;
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
