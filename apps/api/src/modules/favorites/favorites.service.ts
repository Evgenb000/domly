import type { FavoriteResponseDto } from '@domly/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  FAVORITES_REPOSITORY,
  FavoriteWithProperty,
  IFavoritesRepository,
} from './repositories/favorites-repository.interface';
import { toPropertyResponse } from '../properties/mappers/property.mapper';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly favoritesRepository: IFavoritesRepository,
  ) {}

  async create(
    userId: string,
    propertyId: string,
  ): Promise<FavoriteResponseDto> {
    const existing = await this.favoritesRepository.findByUserAndProperty(
      userId,
      propertyId,
    );

    if (existing) {
      return this.mapToResponseDto(existing);
    }

    try {
      const favorite = await this.favoritesRepository.create(
        userId,
        propertyId,
      );
      return this.mapToResponseDto(favorite);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('Property not found');
      }
      throw error;
    }
  }

  async remove(userId: string, propertyId: string): Promise<void> {
    await this.favoritesRepository.deleteByUserAndProperty(userId, propertyId);
  }

  async findMyFavorites(userId: string): Promise<FavoriteResponseDto[]> {
    const favorites = await this.favoritesRepository.findManyByUser(userId);
    return favorites.map((favorite) => this.mapToResponseDto(favorite));
  }

  private mapToResponseDto(
    favorite: FavoriteWithProperty,
  ): FavoriteResponseDto {
    return {
      id: favorite.id,
      propertyId: favorite.propertyId,
      property: toPropertyResponse(favorite.property),
      createdAt: favorite.createdAt.toISOString(),
    };
  }
}
