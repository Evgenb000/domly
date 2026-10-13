export const BOOKING_TTL_MS = 24 * 60 * 60 * 1000;

export function getBookingExpiresAt(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + BOOKING_TTL_MS);
}
