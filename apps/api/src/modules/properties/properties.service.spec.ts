import type { CreatePropertyDto } from '@domly/shared';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { EffectivePricingService } from './pricing/effective-pricing.service';
import {
  PROPERTIES_REPOSITORY,
  type PropertyWithDistrict,
} from './repositories/properties-repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { USERS_REPOSITORY } from '../users/repositories/users-repository.interface';
import { UsersService } from '../users/users.service';

const OWNER_ID = 'owner-1';
const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z');

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

const saleDto: CreatePropertyDto = {
  title: 'Sale listing',
  description: 'Sale listing description',
  category: 'APARTMENT',
  dealType: 'SALE',
  price: 250000,
  area: 60,
  latitude: 50.45,
  longitude: 30.52,
  photos: [],
  districtId: 'district-1',
};

function userFixture(emailVerified: boolean) {
  return {
    id: OWNER_ID,
    email: 'owner@domly.test',
    name: 'Owner',
    passwordHash: 'hash',
    googleId: null,
    role: 'USER' as const,
    emailVerified,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    isBlocked: false,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };
}

function propertyFixture(): PropertyWithDistrict {
  return {
    id: 'property-1',
    title: saleDto.title,
    description: saleDto.description,
    category: 'APARTMENT',
    dealType: 'SALE',
    status: 'AVAILABLE',
    moderationStatus: 'APPROVED',
    price: 250000,
    pricePerNight: null,
    minStayNights: null,
    hasDeposit: null,
    area: 60,
    effectivePrice: 250000,
    address: null,
    latitude: 50.45,
    longitude: 30.52,
    photos: [],
    viewsCount: 0,
    ownerId: OWNER_ID,
    districtId: 'district-1',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    owner: { name: 'Owner', role: 'USER' },
    district: {
      id: 'district-1',
      name: 'District',
      cityId: 'city-1',
      city: { id: 'city-1', name: 'City' },
    },
  };
}

describe('PropertiesService.create', () => {
  let service: PropertiesService;
  let findUserById: jest.Mock<(id: string) => Promise<unknown>>;
  let create: jest.Mock<
    (input: {
      data: CreatePropertyDto;
      ownerId: string;
      effectivePrice: number;
    }) => Promise<PropertyWithDistrict>
  >;
  let calculate: jest.Mock<(dto: CreatePropertyDto) => number>;

  beforeEach(async () => {
    findUserById = jest.fn();
    create = jest.fn();
    calculate = jest.fn<(dto: CreatePropertyDto) => number>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        UsersService,
        { provide: USERS_REPOSITORY, useValue: { findById: findUserById } },
        { provide: PROPERTIES_REPOSITORY, useValue: { create } },
        { provide: EffectivePricingService, useValue: { calculate } },
        { provide: RedisService, useValue: { setNx: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get<PropertiesService>(PropertiesService);
  });

  it('unverified owner gets 403 and the repository is not called', async () => {
    findUserById.mockResolvedValue(userFixture(false));

    await expectHttpError(
      service.create(saleDto, OWNER_ID),
      403,
      'Email must be verified to create a listing',
    );

    expect(create).not.toHaveBeenCalled();
  });

  it('verified owner creates the listing as before', async () => {
    findUserById.mockResolvedValue(userFixture(true));
    calculate.mockReturnValue(250000);
    create.mockResolvedValue(propertyFixture());

    const result = await service.create(saleDto, OWNER_ID);

    expect(result.id).toBe('property-1');
    expect(result.effectivePrice).toBe(250000);
    expect(create).toHaveBeenCalledWith({
      data: saleDto,
      ownerId: OWNER_ID,
      effectivePrice: 250000,
    });
  });
});

describe('PropertiesService.remove', () => {
  let service: PropertiesService;
  let deleteIfAvailable: jest.Mock<(id: string) => Promise<boolean>>;
  let findById: jest.Mock<(id: string) => Promise<PropertyWithDistrict | null>>;

  beforeEach(async () => {
    deleteIfAvailable = jest.fn();
    findById = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        UsersService,
        { provide: USERS_REPOSITORY, useValue: { findById: jest.fn() } },
        {
          provide: PROPERTIES_REPOSITORY,
          useValue: { deleteIfAvailable, findById },
        },
        {
          provide: EffectivePricingService,
          useValue: { calculate: jest.fn() },
        },
        { provide: RedisService, useValue: { setNx: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get<PropertiesService>(PropertiesService);
  });

  it('deleteIfAvailable=false при существующем объекте — ConflictException', async () => {
    deleteIfAvailable.mockResolvedValue(false);
    findById.mockResolvedValue(propertyFixture());

    await expectHttpError(
      service.remove('property-1'),
      409,
      'Property is reserved and cannot be deleted',
    );
    expect(findById).toHaveBeenCalledWith('property-1');
  });

  it('deleteIfAvailable=false при отсутствии объекта — NotFoundException', async () => {
    deleteIfAvailable.mockResolvedValue(false);
    findById.mockResolvedValue(null);

    await expectHttpError(
      service.remove('property-1'),
      404,
      'Property not found',
    );
    expect(findById).toHaveBeenCalledWith('property-1');
  });

  it('deleteIfAvailable=true — удаляет без ошибки, findById не вызывается', async () => {
    deleteIfAvailable.mockResolvedValue(true);

    await expect(service.remove('property-1')).resolves.toBeUndefined();
    expect(findById).not.toHaveBeenCalled();
  });
});
