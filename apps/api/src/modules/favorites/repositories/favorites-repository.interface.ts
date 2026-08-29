import type { Prisma } from '@prisma/client';

export const FAVORITES_REPOSITORY = Symbol('FAVORITES_REPOSITORY');

export type FavoriteWithProperty = Prisma.FavoriteGetPayload<{
  include: { property: true };
}>;

export interface IFavoritesRepository {
  findByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<FavoriteWithProperty | null>;
  create(userId: string, propertyId: string): Promise<FavoriteWithProperty>;
  deleteByUserAndProperty(userId: string, propertyId: string): Promise<void>;
  findManyByUser(userId: string): Promise<FavoriteWithProperty[]>;
}