import type {
  AdminPropertyQueryDto,
  CreatePropertyDto,
  PropertyQueryDto,
} from '@domly/shared';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EffectivePricingService } from './pricing/effective-pricing.service';
import {
  IPropertiesRepository,
  PROPERTIES_REPOSITORY,
  PropertyWithDistrict,
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
    private readonly usersService: UsersService,
  ) {}

  async findMany(
    query: PropertyQueryDto,
  ): Promise<PaginatedResult<PropertyWithDistrict>> {
    const { items, total } = await this.propertiesRepository.findMany(query);
    return this.paginate(items, total, query);
  }

  async findMyProperties(
    ownerId: string,
    query: PropertyQueryDto,
  ): Promise<PaginatedResult<PropertyWithDistrict>> {
    const { items, total } = await this.propertiesRepository.findManyByOwner(
      ownerId,
      query,
    );
    return this.paginate(items, total, query);
  }

  async findManyForAdmin(
    query: AdminPropertyQueryDto,
  ): Promise<PaginatedResult<PropertyWithDistrict>> {
    const { items, total } =
      await this.propertiesRepository.findManyForAdmin(query);
    return this.paginate(items, total, query);
  }

  async findOne(
    id: string,
    currentUser?: CurrentUserPayload,
  ): Promise<PropertyWithDistrict> {
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

  async create(
    dto: CreatePropertyDto,
    ownerId: string,
  ): Promise<PropertyWithDistrict> {
    await this.usersService.ensureEmailVerified(
      ownerId,
      'Email must be verified to create a listing',
    );

    const effectivePrice = this.effectivePricingService.calculate(dto);
    return this.propertiesRepository.create({
      data: dto,
      ownerId,
      effectivePrice,
    });
  }

  async update(
    id: string,
    dto: CreatePropertyDto,
  ): Promise<PropertyWithDistrict> {
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
    const deleted = await this.propertiesRepository.deleteIfAvailable(id);

    if (!deleted) {
      const existing = await this.propertiesRepository.findById(id);
      if (!existing) {
        throw new NotFoundException('Property not found');
      }
      throw new ConflictException('Property is reserved and cannot be deleted');
    }
  }

  async updateModerationStatus(
    id: string,
    moderationStatus: 'APPROVED' | 'REJECTED',
  ): Promise<PropertyWithDistrict> {
    try {
      return await this.propertiesRepository.updateModerationStatus(
        id,
        moderationStatus,
      );
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
    items: PropertyWithDistrict[],
    total: number,
    query: PropertyQueryDto,
  ): PaginatedResult<PropertyWithDistrict> {
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
