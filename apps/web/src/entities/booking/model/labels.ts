import type { BookingStatus } from "./types";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  ACTIVE: "Активна",
  CANCELLED: "Скасована",
  EXPIRED: "Закінчилась",
};
