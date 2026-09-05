import type { BookingResponseDto } from '@domly/shared';
import { toPropertyResponse } from '../../properties/mappers/property.mapper';
import type { BookingWithPropertyAndOwner } from '../repositories/bookings-repository.interface';

export function toBookingResponse(
  booking: BookingWithPropertyAndOwner,
): BookingResponseDto {
  return {
    id: booking.id,
    status: booking.status,
    propertyId: booking.propertyId,
    property: toPropertyResponse(booking.property),
    userId: booking.userId,
    ownerName: booking.property.owner.name,
    ownerEmail: booking.property.owner.email,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
