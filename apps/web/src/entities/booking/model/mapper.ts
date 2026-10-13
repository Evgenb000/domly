import type { BookingResponseDto } from "@domly/shared";
import { toProperty } from "@/entities/property";
import type { Booking } from "./types";

export function toBooking(dto: BookingResponseDto): Booking {
  return {
    id: dto.id,
    status: dto.status,
    propertyId: dto.propertyId,
    property: toProperty(dto.property),
    ownerName: dto.ownerName,
    ownerEmail: dto.ownerEmail,
    createdAt: dto.createdAt,
  };
}
