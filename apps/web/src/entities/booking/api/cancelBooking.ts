import { apiFetch } from "@/shared/api/apiFetch";

export async function cancelBooking(id: string): Promise<void> {
  await apiFetch<void>(`/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
