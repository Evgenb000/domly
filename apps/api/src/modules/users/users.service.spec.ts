import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { User } from '@prisma/client';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import { UsersService } from './users.service';

async function expectHttpError(
  promise: Promise<unknown>,
  status: number,
  message: string,
): Promise<void> {
  const error = await promise.catch((thrown: unknown) => thrown);
  expect(error).toBeInstanceOf(HttpException);
  expect((error as HttpException).getStatus()).toBe(status);
  expect((error as HttpException).message).toBe(message);
}

function userFixture(emailVerified: boolean): User {
  return {
    id: 'user-1',
    email: 'user@domly.test',
    name: 'Test User',
    passwordHash: 'hash',
    googleId: null,
    role: 'USER',
    emailVerified,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    isBlocked: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('UsersService.ensureEmailVerified', () => {
  let service: UsersService;
  let findById: jest.Mock<(id: string) => Promise<User | null>>;

  beforeEach(async () => {
    findById = jest.fn<(id: string) => Promise<User | null>>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: { findById } },
      ],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  it('does not throw for a verified user', async () => {
    findById.mockResolvedValue(userFixture(true));

    await expect(
      service.ensureEmailVerified('user-1', 'Email must be verified'),
    ).resolves.toBeUndefined();
    expect(findById).toHaveBeenCalledWith('user-1');
  });

  it('throws 403 with the caller message for an unverified user', async () => {
    findById.mockResolvedValue(userFixture(false));

    await expectHttpError(
      service.ensureEmailVerified(
        'user-1',
        'Email must be verified to create a booking',
      ),
      403,
      'Email must be verified to create a booking',
    );
  });

  it('throws 404 when the user does not exist', async () => {
    findById.mockResolvedValue(null);

    await expectHttpError(
      service.ensureEmailVerified('missing', 'Email must be verified'),
      404,
      'User not found',
    );
  });
});
