import type { AdminUserQueryDto } from '@domly/shared';
import type { User } from '@prisma/client';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  createUser(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User>;
  createOAuthUser(data: {
    email: string;
    googleId: string;
    name: string;
  }): Promise<User>;
  linkGoogleAccount(userId: string, googleId: string): Promise<void>;
  findMany(query: AdminUserQueryDto): Promise<{ items: User[]; total: number }>;
  updateRole(id: string, role: string): Promise<User>;
  setBlocked(id: string, isBlocked: boolean): Promise<User>;
}
