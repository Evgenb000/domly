import type { CreateBookingDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";

export async function createBooking(propertyId: string): Promise<void> {
  const body: CreateBookingDto = { propertyId };
  await apiFetch<void>("/bookings", { method: "POST", body });
}