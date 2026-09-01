import type { AdminUserQueryDto } from '@domly/shared';
import { Injectable } from '@nestjs/common';
import { Prisma, Role, type User } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { IUsersRepository } from './users-repository.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createOAuthUser(data: {
    email: string;
    googleId: string;
    name: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        googleId: data.googleId,
        name: data.name,
        emailVerified: true,
      },
    });
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        emailVerified: true,
      },
    });
  }

  async findMany(
    query: AdminUserQueryDto,
  ): Promise<{ items: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.isBlocked !== undefined) where.isBlocked = query.isBlocked;
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async updateRole(id: string, role: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role: role as Role },
    });
  }

  async setBlocked(id: string, isBlocked: boolean): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { isBlocked } });
  }
}
