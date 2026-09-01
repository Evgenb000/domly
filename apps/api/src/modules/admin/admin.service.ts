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
import { PropertiesService } from '../properties/properties.service';

@Injectable()
export class AdminService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly propertiesService: PropertiesService,
  ) {}

  async findUsers(query: AdminUserQueryDto) {
    const { items, total } = await this.usersRepository.findMany(query);
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

  async updateUserRole(targetId: string, currentUserId: string, role: string) {
    if (targetId === currentUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }
    try {
      return await this.usersRepository.updateRole(targetId, role);
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
      return await this.usersRepository.setBlocked(targetId, isBlocked);
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
    return this.propertiesService.findManyForAdmin(query);
  }

  async updatePropertyModeration(
    id: string,
    moderationStatus: 'APPROVED' | 'REJECTED',
  ) {
    return this.propertiesService.updateModerationStatus(id, moderationStatus);
  }
}
