import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getQueueToken } from '@nestjs/bullmq';
import { HttpException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import type { Booking, Property, PropertyStatus } from '@prisma/client';
import { BookingsService } from './bookings.service';
import {
  BOOKINGS_REPOSITORY,
  type BookingWithPropertyAndOwner,
} from './repositories/bookings-repository.interface';
import { UsersService } from '../users/users.service';
import { USERS_REPOSITORY } from '../users/repositories/users-repository.interface';

const OWNER_ID = 'owner-1';
const BOOKER_ID = 'booker-1';
const PROPERTY_ID = 'property-1';

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

function userFixture(emailVerified: boolean, id = BOOKER_ID) {
  return {
    id,
    email: 'booker@domly.test',
    name: 'Booker',
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

function propertyFixture(status: PropertyStatus): Property {
  return {
    id: PROPERTY_ID,
    title: 'Test property',
    description: 'Test description',
    category: 'APARTMENT',
    dealType: 'LONG_TERM_RENT',
    status,
    moderationStatus: 'APPROVED',
    price: 12000,
    pricePerNight: null,
    minStayNights: null,
    hasDeposit: true,
    area: 45.5,
    effectivePrice: 12000,
    address: null,
    latitude: 50.4501,
    longitude: 30.5234,
    photos: [],
    viewsCount: 0,
    ownerId: OWNER_ID,
    districtId: 'district-1',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };
}

function bookingFixture(): BookingWithPropertyAndOwner {
  const booking: Booking = {
    id: 'booking-1',
    status: 'ACTIVE',
    autoCancelJobId: null,
    propertyId: PROPERTY_ID,
    userId: BOOKER_ID,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };

  return {
    ...booking,
    property: {
      ...propertyFixture('RESERVED'),
      owner: { name: 'Owner', role: 'USER', email: 'owner@domly.test' },
      district: {
        id: 'district-1',
        name: 'District',
        cityId: 'city-1',
        city: { id: 'city-1', name: 'City' },
      },
    },
  };
}

describe('BookingsService.create', () => {
  let service: BookingsService;
  let findUserById: jest.Mock<(id: string) => Promise<unknown>>;
  let findPropertyForBooking: jest.Mock<
    (propertyId: string) => Promise<{
      id: string;
      ownerId: string;
      status: PropertyStatus;
    } | null>
  >;
  let createWithPropertyLock: jest.Mock<
    (
      propertyId: string,
      userId: string,
    ) => Promise<BookingWithPropertyAndOwner | null>
  >;
  let emit: jest.Mock<(event: string, payload: unknown) => boolean>;

  beforeEach(async () => {
    findUserById = jest.fn();
    findPropertyForBooking = jest.fn();
    createWithPropertyLock = jest.fn();
    emit = jest.fn<(event: string, payload: unknown) => boolean>();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        UsersService,
        { provide: USERS_REPOSITORY, useValue: { findById: findUserById } },
        {
          provide: BOOKINGS_REPOSITORY,
          useValue: { findPropertyForBooking, createWithPropertyLock },
        },
        { provide: EventEmitter2, useValue: { emit } },
        { provide: getQueueToken('booking-auto-cancel'), useValue: {} },
      ],
    }).compile();

    service = moduleRef.get<BookingsService>(BookingsService);
  });

  it('unverified user gets 403, transaction is not opened and no event is emitted', async () => {
    findUserById.mockResolvedValue(userFixture(false));

    await expectHttpError(
      service.create(PROPERTY_ID, BOOKER_ID),
      403,
      'Email must be verified to create a booking',
    );

    expect(findPropertyForBooking).not.toHaveBeenCalled();
    expect(createWithPropertyLock).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('owner booking own listing gets 403, transaction is not opened', async () => {
    findUserById.mockResolvedValue(userFixture(true, OWNER_ID));
    findPropertyForBooking.mockResolvedValue({
      id: PROPERTY_ID,
      ownerId: OWNER_ID,
      status: 'AVAILABLE',
    });

    await expectHttpError(
      service.create(PROPERTY_ID, OWNER_ID),
      403,
      'You cannot book your own listing',
    );

    expect(createWithPropertyLock).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('verified non-owner creates the booking and emits the event', async () => {
    findUserById.mockResolvedValue(userFixture(true));
    findPropertyForBooking.mockResolvedValue({
      id: PROPERTY_ID,
      ownerId: OWNER_ID,
      status: 'AVAILABLE',
    });
    createWithPropertyLock.mockResolvedValue(bookingFixture());

    const result = await service.create(PROPERTY_ID, BOOKER_ID);

    expect(result.id).toBe('booking-1');
    expect(result.status).toBe('ACTIVE');
    expect(createWithPropertyLock).toHaveBeenCalledWith(PROPERTY_ID, BOOKER_ID);
    expect(emit).toHaveBeenCalledWith('booking.created', {
      bookingId: 'booking-1',
    });
  });

  it('verification is checked before property existence', async () => {
    findUserById.mockResolvedValue(userFixture(false));

    await expectHttpError(service.create(PROPERTY_ID, BOOKER_ID), 403);

    expect(findPropertyForBooking).not.toHaveBeenCalled();
  });

  it('missing property gets 404, transaction is not opened', async () => {
    findUserById.mockResolvedValue(userFixture(true));
    findPropertyForBooking.mockResolvedValue(null);

    await expectHttpError(
      service.create(PROPERTY_ID, BOOKER_ID),
      404,
      'Property not found',
    );

    expect(createWithPropertyLock).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('atomic update locking nothing gets 409 and no event is emitted', async () => {
    findUserById.mockResolvedValue(userFixture(true));
    findPropertyForBooking.mockResolvedValue({
      id: PROPERTY_ID,
      ownerId: OWNER_ID,
      status: 'AVAILABLE',
    });
    createWithPropertyLock.mockResolvedValue(null);

    await expectHttpError(service.create(PROPERTY_ID, BOOKER_ID), 409);

    expect(emit).not.toHaveBeenCalled();
  });
});
