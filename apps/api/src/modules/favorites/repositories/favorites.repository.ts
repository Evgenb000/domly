import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  FavoriteWithProperty,
  IFavoritesRepository,
} from './favorites-repository.interface';

@Injectable()
export class FavoritesRepository implements IFavoritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<FavoriteWithProperty | null> {
    return this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      include: { property: true },
    });
  }

  async create(
    userId: string,
    propertyId: string,
  ): Promise<FavoriteWithProperty> {
    return this.prisma.favorite.create({
      data: { userId, propertyId },
      include: { property: true },
    });
  }

  async deleteByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });
  }

  async findManyByUser(userId: string): Promise<FavoriteWithProperty[]> {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { property: true },
    });
  }
}