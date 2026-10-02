import type { FavoriteResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toFavorite } from "../model/mapper";
import type { Favorite } from "../model/mapper";

export async function getFavorites(): Promise<Favorite[]> {
  const data = await apiFetch<FavoriteResponseDto[]>("/favorites/my");
  return data.map(toFavorite);
}