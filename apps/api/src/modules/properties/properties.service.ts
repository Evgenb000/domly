import type { CreatePropertyDto, PropertyQueryDto } from '@domly/shared';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Property } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EffectivePricingService } from './pricing/effective-pricing.service';
import {
  IPropertiesRepository,
  PROPERTIES_REPOSITORY,
} from './repositories/properties-repository.interface';

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
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @Inject(PROPERTIES_REPOSITORY)
    private readonly propertiesRepository: IPropertiesRepository,
    private readonly effectivePricingService: EffectivePricingService,
    private readonly redisService: RedisService,
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

    const isOwnerOrAdmin = isOwner || isAdmin;

    if (currentUser && !isOwnerOrAdmin) {
      const dedupKey = `views:dedup:${id}:${currentUser.id}`;
      try {
        const isFirstView = await this.redisService.setNx(dedupKey, '1', 1800);

        if (isFirstView) {
          await this.propertiesRepository.incrementViews(id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to increment views for property ${id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
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
    const existing = await this.propertiesRepository.findById(id);
    if (existing && existing.dealType !== dto.dealType) {
      throw new ConflictException('dealType cannot be changed after creation');
    }

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
