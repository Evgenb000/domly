import type { FavoriteResponseDto } from "@domly/shared";
import { toProperty, type Property } from "@/entities/property";

export interface Favorite {
  id: string;
  propertyId: string;
  property: Property;
  createdAt: string;
}

export function toFavorite(dto: FavoriteResponseDto): Favorite {
  return {
    id: dto.id,
    propertyId: dto.propertyId,
    property: toProperty(dto.property),
    createdAt: dto.createdAt,
  };
}