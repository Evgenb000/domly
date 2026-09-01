import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
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
}