import type { FavoriteResponseDto } from "@domly/shared";

export interface Favorite {
  propertyId: string;
  createdAt: string;
}

export function toFavorite(dto: FavoriteResponseDto): Favorite {
  return {
    propertyId: dto.propertyId,
    createdAt: dto.createdAt,
  };
}