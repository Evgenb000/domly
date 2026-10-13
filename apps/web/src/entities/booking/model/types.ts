import type { BookingResponseDto } from "@domly/shared";
import type { PaginationMeta, Property } from "@/entities/property";

export type BookingStatus = BookingResponseDto["status"];

export interface Booking {
  id: string;
  status: BookingStatus;
  propertyId: string;
  property: Property;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
}

export interface BookingsPage {
  items: Booking[];
  meta: PaginationMeta;
}
