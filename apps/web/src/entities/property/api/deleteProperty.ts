import { apiFetch } from "@/shared/api/apiFetch";

export async function deleteProperty(id: string): Promise<void> {
  await apiFetch<void>(`/properties/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
