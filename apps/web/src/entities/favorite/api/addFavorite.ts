import type { CreateFavoriteDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";

export async function addFavorite(propertyId: string): Promise<void> {
  const body: CreateFavoriteDto = { propertyId };
  await apiFetch<void>("/favorites", { method: "POST", body });
}