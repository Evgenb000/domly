import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { GoogleProfile } from './strategies/google.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { USERS_REPOSITORY } from '../users/repositories/users-repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';

const GOOGLE_ID = 'google-1';
const EMAIL = 'oauth@domly.test';

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z');

async function expectHttpError(
  promise: Promise<unknown>,
  status: number,
  message?: string,
): Promise<void> {
  const error = await promise.catch((thrown: unknown) => thrown);
  expect(error).toBeInstanceOf(HttpException);
  expect((error as HttpException).getStatus()).toBe(status);
  if (message !== undefined) {
    expect((error as HttpException).message).toBe(message);
  }
}

function verifiedProfile(
  overrides: Partial<GoogleProfile> = {},
): GoogleProfile {
  return {
    googleId: GOOGLE_ID,
    email: EMAIL,
    name: 'OAuth User',
    emailVerified: true,
    ...overrides,
  };
}

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: EMAIL,
    name: 'OAuth User',
    passwordHash: null,
    googleId: null,
    role: 'USER',
    emailVerified: false,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    isBlocked: false,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

describe('AuthService.validateOAuthLogin', () => {
  let service: AuthService;
  let findByGoogleId: jest.Mock<(googleId: string) => Promise<User | null>>;
  let findByEmail: jest.Mock<(email: string) => Promise<User | null>>;
  let createOAuthUser: jest.Mock<
    (data: { email: string; googleId: string; name: string }) => Promise<User>
  >;
  let linkGoogleAccount: jest.Mock<
    (userId: string, googleId: string) => Promise<void>
  >;
  let getOrThrow: jest.Mock<(key: string) => string>;

  beforeEach(async () => {
    findByGoogleId = jest.fn<(googleId: string) => Promise<User | null>>();
    findByEmail = jest.fn<(email: string) => Promise<User | null>>();
    createOAuthUser =
      jest.fn<
        (data: {
          email: string;
          googleId: string;
          name: string;
        }) => Promise<User>
      >();
    linkGoogleAccount =
      jest.fn<(userId: string, googleId: string) => Promise<void>>();
    getOrThrow = jest.fn<(key: string) => string>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: {} },
        {
          provide: USERS_REPOSITORY,
          useValue: {
            findByGoogleId,
            findByEmail,
            createOAuthUser,
            linkGoogleAccount,
          },
        },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { getOrThrow } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: NotificationsService, useValue: { queueEmail: jest.fn() } },
        { provide: RedisService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
  });

  it('creates a new Google user with a verified email', async () => {
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(null);
    createOAuthUser.mockResolvedValue(
      userFixture({ googleId: GOOGLE_ID, emailVerified: true }),
    );

    const result = await service.validateOAuthLogin(verifiedProfile());

    expect(createOAuthUser).toHaveBeenCalledWith({
      email: EMAIL,
      googleId: GOOGLE_ID,
      name: 'OAuth User',
    });
    expect(linkGoogleAccount).not.toHaveBeenCalled();
    expect(result.emailVerified).toBe(true);
  });

  it('links an existing email account and marks it as verified', async () => {
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(userFixture({ id: 'user-existing' }));

    const result = await service.validateOAuthLogin(verifiedProfile());

    expect(linkGoogleAccount).toHaveBeenCalledWith('user-existing', GOOGLE_ID);
    expect(createOAuthUser).not.toHaveBeenCalled();
    expect(result.id).toBe('user-existing');
  });

  it('rejects a profile Google has not verified and touches nothing', async () => {
    await expectHttpError(
      service.validateOAuthLogin(verifiedProfile({ emailVerified: false })),
      403,
    );

    expect(findByGoogleId).not.toHaveBeenCalled();
    expect(findByEmail).not.toHaveBeenCalled();
    expect(createOAuthUser).not.toHaveBeenCalled();
    expect(linkGoogleAccount).not.toHaveBeenCalled();
  });

  it('rejects a Google account that is blocked', async () => {
    findByGoogleId.mockResolvedValue(
      userFixture({ googleId: GOOGLE_ID, isBlocked: true }),
    );

    await expectHttpError(
      service.validateOAuthLogin(verifiedProfile()),
      403,
      'Account is blocked',
    );

    expect(createOAuthUser).not.toHaveBeenCalled();
    expect(linkGoogleAccount).not.toHaveBeenCalled();
  });
});
