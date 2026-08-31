import type { PropertyQueryDto } from '@domly/shared';
import { Injectable } from '@nestjs/common';
import { Prisma, Property } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  IPropertiesRepository,
  PaginatedProperties,
  PropertyCreateInput,
  PropertyUpdateInput,
} from './properties-repository.interface';

@Injectable()
export class PropertiesRepository implements IPropertiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: PropertyQueryDto): Promise<PaginatedProperties> {
    const where = this.buildWhere(query, { moderationStatus: 'APPROVED' });
    return this.paginate(where, query);
  }

  async findManyByOwner(
    ownerId: string,
    query: PropertyQueryDto,
  ): Promise<PaginatedProperties> {
    const where = this.buildWhere(query, { ownerId });
    return this.paginate(where, query);
  }

  async findById(id: string): Promise<Property | null> {
    return this.prisma.property.findUnique({ where: { id } });
  }

  async create(input: PropertyCreateInput): Promise<Property> {
    return this.prisma.property.create({
      data: {
        ...input.data,
        ownerId: input.ownerId,
        effectivePrice: input.effectivePrice,
      },
    });
  }

  async update(id: string, input: PropertyUpdateInput): Promise<Property> {
    return this.prisma.property.update({
      where: { id },
      data: {
        ...input.data,
        effectivePrice: input.effectivePrice,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.property.delete({ where: { id } });
  }

  async incrementViews(id: string): Promise<void> {
    try {
      await this.prisma.property.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return;
      }
      throw error;
    }
  }

  private async paginate(
    where: Prisma.PropertyWhereInput,
    query: PropertyQueryDto,
  ): Promise<PaginatedProperties> {
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { items, total };
  }

  private buildWhere(
    query: PropertyQueryDto,
    extra: Prisma.PropertyWhereInput,
  ): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = { ...extra };

    if (query.dealType) where.dealType = query.dealType;
    if (query.category) where.category = query.category;
    if (query.districtId) where.districtId = query.districtId;

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.effectivePrice = {
        ...(query.priceMin !== undefined ? { gte: query.priceMin } : {}),
        ...(query.priceMax !== undefined ? { lte: query.priceMax } : {}),
      };
    }

    if (query.areaMin !== undefined || query.areaMax !== undefined) {
      where.area = {
        ...(query.areaMin !== undefined ? { gte: query.areaMin } : {}),
        ...(query.areaMax !== undefined ? { lte: query.areaMax } : {}),
      };
    }

    return where;
  }

  private buildOrderBy(
    query: PropertyQueryDto,
  ): Prisma.PropertyOrderByWithRelationInput {
    const field = query.sortBy === 'price' ? 'effectivePrice' : 'createdAt';
    return { [field]: query.sortOrder };
  }
}
