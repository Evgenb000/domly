import type { BookingResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import type { PaginationMeta } from "@/entities/property";
import { toBooking } from "../model/mapper";
import type { Booking } from "../model/types";

interface GetMyBookingsResponse {
  items: BookingResponseDto[];
  meta: PaginationMeta;
}

export async function getMyBookings(
  page: number,
  limit = 10,
): Promise<{ items: Booking[]; meta: PaginationMeta }> {
  const data = await apiFetch<GetMyBookingsResponse>(
    `/bookings/my?page=${page}&limit=${limit}`,
  );
  return {
    items: data.items.map(toBooking),
    meta: data.meta,
  };
}
