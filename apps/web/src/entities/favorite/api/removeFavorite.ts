import { apiFetch } from "@/shared/api/apiFetch";

export async function removeFavorite(propertyId: string): Promise<void> {
  await apiFetch<void>(`/favorites/${encodeURIComponent(propertyId)}`, {
    method: "DELETE",
  });
}