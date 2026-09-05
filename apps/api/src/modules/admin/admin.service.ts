import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AdminPropertyQueryDto, AdminUserQueryDto } from '@domly/shared';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from '../users/repositories/users-repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PropertiesService } from '../properties/properties.service';
import { toPropertyResponse } from '../properties/mappers/property.mapper';
import { toUserResponse } from '../users/mappers/user.mapper';
import {
  AnalyticsRepository,
  type ConversionFunnel,
  type DailyStat,
  type TopProperty,
} from './repositories/analytics.repository';

export interface AdminDashboard {
  counts: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
  };
  dailyStats: {
    users: DailyStat[];
    properties: DailyStat[];
    bookings: DailyStat[];
  };
  topProperties: TopProperty[];
  funnel: ConversionFunnel;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly propertiesService: PropertiesService,
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly redisService: RedisService,
  ) {}

  async findUsers(query: AdminUserQueryDto) {
    const { items, total } = await this.usersRepository.findMany(query);
    return {
      items: items.map(toUserResponse),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async updateUserRole(targetId: string, currentUserId: string, role: string) {
    if (targetId === currentUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    try {
      const user = await this.usersRepository.updateRole(targetId, role);
      return toUserResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async setUserBlocked(
    targetId: string,
    currentUserId: string,
    isBlocked: boolean,
  ) {
    if (targetId === currentUserId) {
      throw new ForbiddenException('Cannot block/unblock yourself');
    }
    try {
      const user = await this.usersRepository.setBlocked(targetId, isBlocked);
      return toUserResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async findProperties(query: AdminPropertyQueryDto) {
    const result = await this.propertiesService.findManyForAdmin(query);
    return {
      items: result.items.map(toPropertyResponse),
      meta: result.meta,
    };
  }

  async updatePropertyModeration(
    id: string,
    moderationStatus: 'APPROVED' | 'REJECTED',
  ) {
    const property = await this.propertiesService.updateModerationStatus(
      id,
      moderationStatus,
    );
    return toPropertyResponse(property);
  }

  async getDashboard(): Promise<AdminDashboard> {
    const cacheKey = 'admin:analytics:dashboard';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AdminDashboard;
    }

    const [
      counts,
      dailyUsers,
      dailyProperties,
      dailyBookings,
      topProperties,
      funnel,
    ] = await Promise.all([
      this.analyticsRepository.getPlatformCounts(),
      this.analyticsRepository.getDailyNewUsers(),
      this.analyticsRepository.getDailyNewProperties(),
      this.analyticsRepository.getDailyNewBookings(),
      this.analyticsRepository.getTopPropertiesByViews(10),
      this.analyticsRepository.getConversionFunnel(),
    ]);

    const dashboard = {
      counts,
      dailyStats: {
        users: dailyUsers,
        properties: dailyProperties,
        bookings: dailyBookings,
      },
      topProperties,
      funnel,
    };

    await this.redisService.set(cacheKey, JSON.stringify(dashboard), 300);

    return dashboard;
  }
}
