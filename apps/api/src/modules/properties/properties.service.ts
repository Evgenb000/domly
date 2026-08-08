import type { CreatePropertyDto, PropertyQueryDto } from '@domly/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Property } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { EffectivePricingService } from './pricing/effective-pricing.service';
import {
  IPropertiesRepository,
  PROPERTIES_REPOSITORY,
} from './repositories/properties-repository.interface';

export interface CurrentUserPayload {
  id: string;
  role: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTIES_REPOSITORY)
    private readonly propertiesRepository: IPropertiesRepository,
    private readonly effectivePricingService: EffectivePricingService,
  ) {}

  async findMany(query: PropertyQueryDto): Promise<PaginatedResult<Property>> {
    const { items, total } = await this.propertiesRepository.findMany(query);
    return this.paginate(items, total, query);
  }

  async findMyProperties(
    ownerId: string,
    query: PropertyQueryDto,
  ): Promise<PaginatedResult<Property>> {
    const { items, total } = await this.propertiesRepository.findManyByOwner(
      ownerId,
      query,
    );
    return this.paginate(items, total, query);
  }

  async findOne(
    id: string,
    currentUser?: CurrentUserPayload,
  ): Promise<Property> {
    const property = await this.propertiesRepository.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const isOwner = currentUser?.id === property.ownerId;
    const isAdmin = currentUser?.role === 'ADMIN';

    if (property.moderationStatus === 'REJECTED' && !isOwner && !isAdmin) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async create(dto: CreatePropertyDto, ownerId: string): Promise<Property> {
    const effectivePrice = this.effectivePricingService.calculate(dto);
    return this.propertiesRepository.create({
      data: dto,
      ownerId,
      effectivePrice,
    });
  }

  async update(id: string, dto: CreatePropertyDto): Promise<Property> {
    const effectivePrice = this.effectivePricingService.calculate(dto);
    try {
      return await this.propertiesRepository.update(id, {
        data: dto,
        effectivePrice,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Property not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.propertiesRepository.delete(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Property not found');
      }
      throw error;
    }
  }

  private paginate(
    items: Property[],
    total: number,
    query: PropertyQueryDto,
  ): PaginatedResult<Property> {
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
