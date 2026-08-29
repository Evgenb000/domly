import { BookingResponseSchema } from '@domly/shared';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { hashValue } from '../src/common/utils/hash.util';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { BookingAutoCancelProcessor } from '../src/modules/bookings/processors/booking-auto-cancel.processor';

const FIXED_PASSWORD = 'E2ePassword123!';

jest.setTimeout(120000);

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let bookerToken: string;
  let ownerId: string;
  let bookerId: string;
  let propertyId: string;

  async function createActiveBooking(userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.property.updateMany({
        where: { id: propertyId, status: 'AVAILABLE' },
        data: { status: 'RESERVED' },
      });

      return tx.booking.create({
        data: {
          status: 'ACTIVE',
          property: { connect: { id: propertyId } },
          user: { connect: { id: userId } },
        },
      });
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await hashValue(FIXED_PASSWORD);
    const suffix = Date.now();

    const owner = await prisma.user.create({
      data: {
        email: `e2e-owner-${suffix}@test.local`,
        name: 'E2E Owner',
        passwordHash,
        emailVerified: true,
      },
    });

    const booker = await prisma.user.create({
      data: {
        email: `e2e-booker-${suffix}@test.local`,
        name: 'E2E Booker',
        passwordHash,
        emailVerified: true,
      },
    });

    ownerId = owner.id;
    bookerId = booker.id;

    let district = await prisma.district.findFirst({
      include: { city: true },
    });

    if (!district) {
      const city = await prisma.city.create({
        data: { name: `E2E City ${suffix}` },
      });
      district = await prisma.district.create({
        data: { name: `E2E District ${suffix}`, cityId: city.id },
        include: { city: true },
      });
    }

    const property = await prisma.property.create({
      data: {
        title: 'E2E Test Property',
        description:
          'E2E test property description for bookings integration tests.',
        category: 'APARTMENT',
        dealType: 'LONG_TERM_RENT',
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        price: 12000,
        hasDeposit: true,
        area: 45.5,
        effectivePrice: 12000,
        address: 'вул. Тестова, 1',
        latitude: 50.4501,
        longitude: 30.5234,
        photos: ['https://picsum.photos/seed/e2e-booking/900/650'],
        ownerId: owner.id,
        districtId: district.id,
      },
    });

    propertyId = property.id;

    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    const accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    ownerToken = await jwtService.signAsync(
      { sub: owner.id, role: owner.role },
      { secret: accessSecret },
    );
    bookerToken = await jwtService.signAsync(
      { sub: booker.id, role: booker.role },
      { secret: accessSecret },
    );
  });

  afterEach(async () => {
    await prisma.booking.deleteMany({ where: { propertyId } });
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'AVAILABLE' },
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, bookerId] } },
    });
    await app.close();
  });

  it('setup works', () => {
    expect(true).toBe(true);
  });

  describe('POST /bookings', () => {
    it('создаёт бронь и переводит property в RESERVED', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${bookerToken}`)
        .send({ propertyId })
        .expect(201);

      const parsed = BookingResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.status).toBe('ACTIVE');

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.status).toBe('RESERVED');

      let booking = await prisma.booking.findFirst({
        where: { propertyId },
      });
      expect(booking).not.toBeNull();
      expect(booking!.status).toBe('ACTIVE');

      const deadline = Date.now() + 5000;
      while (!booking!.autoCancelJobId && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        booking = await prisma.booking.findFirst({
          where: { propertyId },
        });
      }

      expect(booking!.autoCancelJobId).not.toBeNull();
      expect(typeof booking!.autoCancelJobId).toBe('string');

      const queue = app.get<Queue>(getQueueToken('booking-auto-cancel'));
      const job = await queue.getJob(booking!.autoCancelJobId!);
      expect(job).not.toBeNull();
      expect(job!.opts.delay).toBe(24 * 60 * 60 * 1000);
    });

    it('возвращает 409 при попытке забронировать уже RESERVED property', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${bookerToken}`)
        .send({ propertyId })
        .expect(201);

      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ propertyId })
        .expect(409);
    });

    it('защищает от race condition при параллельных запросах на один property', async () => {
      const results = await Promise.allSettled([
        request(app.getHttpServer())
          .post('/bookings')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ propertyId }),
        request(app.getHttpServer())
          .post('/bookings')
          .set('Authorization', `Bearer ${bookerToken}`)
          .send({ propertyId }),
      ]);

      const statuses = results.map((result) =>
        result.status === 'fulfilled' ? result.value.status : 0,
      );

      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(1);

      const activeBookings = await prisma.booking.count({
        where: { propertyId, status: 'ACTIVE' },
      });
      expect(activeBookings).toBe(1);
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('владелец объекта может отменить бронь', async () => {
      const booking = await createActiveBooking(bookerId);

      await request(app.getHttpServer())
        .delete(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      const cancelled = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(cancelled?.status).toBe('CANCELLED');

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.status).toBe('AVAILABLE');
    });

    it('инициатор брони может отменить свою бронь', async () => {
      const booking = await createActiveBooking(bookerId);

      await request(app.getHttpServer())
        .delete(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(204);

      const cancelled = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(cancelled?.status).toBe('CANCELLED');

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.status).toBe('AVAILABLE');
    });

    it('чужой пользователь не может отменить бронь — 403', async () => {
      const booking = await createActiveBooking(bookerId);

      const passwordHash = await hashValue(FIXED_PASSWORD);
      const stranger = await prisma.user.create({
        data: {
          email: `e2e-stranger-${Date.now()}@test.local`,
          name: 'E2E Stranger',
          passwordHash,
          emailVerified: true,
        },
      });

      try {
        const jwtService = app.get(JwtService);
        const configService = app.get(ConfigService);
        const accessSecret =
          configService.getOrThrow<string>('JWT_ACCESS_SECRET');
        const strangerToken = await jwtService.signAsync(
          { sub: stranger.id, role: stranger.role },
          { secret: accessSecret },
        );

        await request(app.getHttpServer())
          .delete(`/bookings/${booking.id}`)
          .set('Authorization', `Bearer ${strangerToken}`)
          .expect(403);

        const unchanged = await prisma.booking.findUnique({
          where: { id: booking.id },
        });
        expect(unchanged?.status).toBe('ACTIVE');

        const property = await prisma.property.findUnique({
          where: { id: propertyId },
        });
        expect(property?.status).toBe('RESERVED');
      } finally {
        await prisma.user.delete({ where: { id: stranger.id } });
      }
    });

    it('повторная отмена уже CANCELLED брони — 409', async () => {
      const booking = await createActiveBooking(bookerId);

      await request(app.getHttpServer())
        .delete(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(409);
    });
  });

  describe('BookingAutoCancelProcessor', () => {
    async function runProcessor(bookingId: string) {
      const queue = app.get<Queue>(getQueueToken('booking-auto-cancel'));
      const processor = app.get(BookingAutoCancelProcessor);

      const added = await queue.add(
        'auto-cancel',
        { bookingId },
        { delay: 60000 },
      );
      const job = await queue.getJob(added.id!);

      try {
        await processor.process(job!);
      } finally {
        await job!.remove();
      }
    }

    it('идемпотентен: не трогает уже CANCELLED бронь', async () => {
      const booking = await createActiveBooking(bookerId);

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });

      await runProcessor(booking.id);

      const cancelled = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(cancelled?.status).toBe('CANCELLED');

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.status).toBe('RESERVED');
    });

    it('переводит ACTIVE бронь в EXPIRED и освобождает property', async () => {
      const booking = await createActiveBooking(ownerId);

      await runProcessor(booking.id);

      const expired = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(expired?.status).toBe('EXPIRED');

      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });
      expect(property?.status).toBe('AVAILABLE');
    });
  });
});
