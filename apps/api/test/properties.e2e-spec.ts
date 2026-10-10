import { PropertyResponseSchema } from '@domly/shared';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { hashValue } from '../src/common/utils/hash.util';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const FIXED_PASSWORD = 'E2ePassword123!';
const UNIQUE = Date.now();

jest.setTimeout(120000);

describe('Properties (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let bookerToken: string;
  let adminToken: string;
  let ownerId: string;
  let bookerId: string;

  let districtId: string;
  let districtCreated = false;
  let createdDistrictId: string | null = null;
  let createdCityId: string | null = null;

  const createdUserIds: string[] = [];
  const createdPropertyIds: string[] = [];

  function trackProperty(id: string): void {
    createdPropertyIds.push(id);
  }

  function salePayload(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      title: `E2E Sale Property ${UNIQUE}`,
      description: 'E2E sale property description for integration tests.',
      category: 'APARTMENT',
      area: 60,
      latitude: 50.45,
      longitude: 30.52,
      photos: ['https://picsum.photos/seed/e2e-properties-sale/900/650'],
      districtId,
      dealType: 'SALE',
      price: 250000,
      ...overrides,
    };
  }

  function dailyPayload(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      title: `E2E Daily Property ${UNIQUE}`,
      description: 'E2E daily rent property description for integration tests.',
      category: 'APARTMENT',
      area: 40,
      latitude: 50.44,
      longitude: 30.51,
      photos: ['https://picsum.photos/seed/e2e-properties-daily/900/650'],
      districtId,
      dealType: 'DAILY_RENT',
      pricePerNight: 1200,
      minStayNights: 2,
      ...overrides,
    };
  }

  async function seedProperty(
    overrides: Partial<Prisma.PropertyUncheckedCreateInput> = {},
  ): Promise<{ id: string }> {
    const property = await prisma.property.create({
      data: {
        title: `E2E Seeded Property ${UNIQUE}`,
        description: 'E2E seeded property description for integration tests.',
        category: 'APARTMENT',
        dealType: 'SALE',
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        price: 100000,
        effectivePrice: 100000,
        area: 50,
        latitude: 50.43,
        longitude: 30.5,
        photos: ['https://picsum.photos/seed/e2e-properties-seed/900/650'],
        ownerId,
        districtId,
        ...overrides,
      },
    });
    trackProperty(property.id);
    return { id: property.id };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await hashValue(FIXED_PASSWORD);

    const owner = await prisma.user.create({
      data: {
        email: `e2e-prop-owner-${UNIQUE}@test.local`,
        name: 'E2E Property Owner',
        passwordHash,
        emailVerified: true,
      },
    });
    createdUserIds.push(owner.id);

    const booker = await prisma.user.create({
      data: {
        email: `e2e-prop-booker-${UNIQUE}@test.local`,
        name: 'E2E Property Booker',
        passwordHash,
        emailVerified: true,
      },
    });
    createdUserIds.push(booker.id);

    const admin = await prisma.user.create({
      data: {
        email: `e2e-prop-admin-${UNIQUE}@test.local`,
        name: 'E2E Property Admin',
        passwordHash,
        emailVerified: true,
        role: 'ADMIN',
      },
    });
    createdUserIds.push(admin.id);

    ownerId = owner.id;
    bookerId = booker.id;

    let district = await prisma.district.findFirst({
      include: { city: true },
    });

    if (!district) {
      const city = await prisma.city.create({
        data: { name: `E2E Property City ${UNIQUE}` },
      });
      createdCityId = city.id;
      district = await prisma.district.create({
        data: { name: `E2E Property District ${UNIQUE}`, cityId: city.id },
        include: { city: true },
      });
      createdDistrictId = district.id;
      districtCreated = true;
    }

    districtId = district.id;

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
    adminToken = await jwtService.signAsync(
      { sub: admin.id, role: admin.role },
      { secret: accessSecret },
    );
  });

  afterEach(async () => {
    await prisma.property.deleteMany({
      where: { id: { in: createdPropertyIds } },
    });
    createdPropertyIds.length = 0;
  });

  afterAll(async () => {
    await prisma.property.deleteMany({
      where: { id: { in: createdPropertyIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });

    if (districtCreated && createdDistrictId) {
      await prisma.district.delete({ where: { id: createdDistrictId } });
    }
    if (createdCityId) {
      await prisma.city.delete({ where: { id: createdCityId } });
    }

    await app.close();
  });

  describe('POST /properties', () => {
    it('создаёт SALE-объявление: effectivePrice === price, moderationStatus APPROVED', async () => {
      const res = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(salePayload())
        .expect(201);

      trackProperty(res.body.id);

      expect(res.body.effectivePrice).toBe(250000);
      expect(res.body.dealType).toBe('SALE');
      expect(res.body.moderationStatus).toBe('APPROVED');

      const parse = PropertyResponseSchema.safeParse(res.body);
      expect(parse.success).toBe(true);

      const stored = await prisma.property.findUnique({
        where: { id: res.body.id },
      });
      expect(stored?.moderationStatus).toBe('APPROVED');
      expect(stored?.effectivePrice).toBe(250000);
    });

    it('создаёт DAILY_RENT-объявление: effectivePrice === pricePerNight', async () => {
      const res = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(dailyPayload({ pricePerNight: 1200 }))
        .expect(201);

      trackProperty(res.body.id);

      expect(res.body.effectivePrice).toBe(1200);
      expect(res.body.dealType).toBe('DAILY_RENT');
      expect(res.body.moderationStatus).toBe('APPROVED');

      const parse = PropertyResponseSchema.safeParse(res.body);
      expect(parse.success).toBe(true);

      const stored = await prisma.property.findUnique({
        where: { id: res.body.id },
      });
      expect(stored?.effectivePrice).toBe(1200);
    });

    it('без токена — 401', async () => {
      await request(app.getHttpServer())
        .post('/properties')
        .send(salePayload())
        .expect(401);
    });
  });

  describe('PATCH /properties/:id', () => {
    it('владелец может обновить title/description/price — effectivePrice пересчитывается', async () => {
      const { id } = await seedProperty({ price: 100000 });

      const res = await request(app.getHttpServer())
        .patch(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(salePayload({ title: 'Updated E2E Title', price: 175000 }))
        .expect(200);

      expect(res.body.id).toBe(id);
      expect(res.body.title).toBe('Updated E2E Title');
      expect(res.body.price).toBe(175000);
      expect(res.body.effectivePrice).toBe(175000);
      expect(res.body.dealType).toBe('SALE');
    });

    it('попытка сменить dealType — 409 ConflictException', async () => {
      const { id } = await seedProperty({ price: 100000 });

      await request(app.getHttpServer())
        .patch(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(dailyPayload())
        .expect(409);
    });

    it('не-владелец — 403', async () => {
      const { id } = await seedProperty();

      await request(app.getHttpServer())
        .patch(`/properties/${id}`)
        .set('Authorization', `Bearer ${bookerToken}`)
        .send(salePayload({ title: 'Hacked Title' }))
        .expect(403);
    });

    it('ADMIN может обновить чужое объявление — 200', async () => {
      const { id } = await seedProperty();

      const res = await request(app.getHttpServer())
        .patch(`/properties/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(salePayload({ title: 'Admin Updated Title', price: 99999 }))
        .expect(200);

      expect(res.body.ownerId).toBe(ownerId);
      expect(res.body.title).toBe('Admin Updated Title');
      expect(res.body.effectivePrice).toBe(99999);
    });

    it('обновление несуществующего id — 404', async () => {
      await request(app.getHttpServer())
        .patch('/properties/clx0000000000000000000000')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(salePayload())
        .expect(404);
    });
  });

  describe('DELETE /properties/:id', () => {
    it('владелец удаляет своё — 204, findUnique возвращает null', async () => {
      const { id } = await seedProperty();

      await request(app.getHttpServer())
        .delete(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      const stored = await prisma.property.findUnique({ where: { id } });
      expect(stored).toBeNull();
    });

    it('не-владелец — 403', async () => {
      const { id } = await seedProperty();

      await request(app.getHttpServer())
        .delete(`/properties/${id}`)
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(403);

      const stored = await prisma.property.findUnique({ where: { id } });
      expect(stored).not.toBeNull();
    });

    it('ADMIN может удалить чужое — 204', async () => {
      const { id } = await seedProperty();

      await request(app.getHttpServer())
        .delete(`/properties/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const stored = await prisma.property.findUnique({ where: { id } });
      expect(stored).toBeNull();
    });

    it('повторное удаление — 404', async () => {
      const { id } = await seedProperty();

      await request(app.getHttpServer())
        .delete(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });
  });
  describe('GET /properties (публичный список)', () => {
    it('REJECTED объявление не видно в публичном списке, APPROVED видно', async () => {
      const approved = await seedProperty();
      const rejected = await seedProperty({ moderationStatus: 'REJECTED' });

      const res = await request(app.getHttpServer())
        .get('/properties')
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(200);

      const ids = res.body.items.map((item: { id: string }) => item.id);
      expect(ids).toContain(approved.id);
      expect(ids).not.toContain(rejected.id);
    });

    it('фильтр по dealType корректно фильтрует', async () => {
      const sale = await seedProperty({ dealType: 'SALE', price: 100000 });
      const daily = await seedProperty({
        dealType: 'DAILY_RENT',
        price: null,
        pricePerNight: 1200,
        effectivePrice: 1200,
      });

      const res = await request(app.getHttpServer())
        .get('/properties?dealType=SALE')
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(200);

      const items = res.body.items as Array<{ id: string; dealType: string }>;
      expect(items.every((item) => item.dealType === 'SALE')).toBe(true);
      const ids = items.map((item) => item.id);
      expect(ids).toContain(sale.id);
      expect(ids).not.toContain(daily.id);
    });

    it('стабильна offset-пагинация при равном createdAt: страницы не пересекаются и покрывают все', async () => {
      const sameCreatedAt = new Date('2020-01-01T00:00:00.000Z');
      const tiePrice = 777777;
      const seeded = [
        await seedProperty({
          createdAt: sameCreatedAt,
          price: tiePrice,
          effectivePrice: tiePrice,
        }),
        await seedProperty({
          createdAt: sameCreatedAt,
          price: tiePrice,
          effectivePrice: tiePrice,
        }),
        await seedProperty({
          createdAt: sameCreatedAt,
          price: tiePrice,
          effectivePrice: tiePrice,
        }),
      ];
      const seededIds = seeded.map((property) => property.id);

      for (const sort of [
        { sortBy: 'createdAt', sortOrder: 'desc' },
        { sortBy: 'price', sortOrder: 'asc' },
      ]) {
        const pageIds: string[] = [];
        for (let page = 1; page <= 3; page++) {
          const res = await request(app.getHttpServer())
            .get('/properties')
            .query({
              ...sort,
              priceMin: tiePrice,
              priceMax: tiePrice,
              limit: 1,
              page,
            })
            .set('Authorization', `Bearer ${bookerToken}`)
            .expect(200);

          const items = res.body.items as Array<{ id: string }>;
          expect(items).toHaveLength(1);
          pageIds.push(items[0].id);
        }

        expect(new Set(pageIds).size).toBe(3);
        expect([...pageIds].sort()).toEqual([...seededIds].sort());
      }
    });
  });

  describe('GET /properties/my', () => {
    it('возвращает только объявления текущего юзера, включая REJECTED', async () => {
      const myApproved = await seedProperty({ ownerId });
      const myRejected = await seedProperty({
        ownerId,
        moderationStatus: 'REJECTED',
      });
      const theirProperty = await seedProperty({ ownerId: bookerId });

      const res = await request(app.getHttpServer())
        .get('/properties/my')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const items = res.body.items as Array<{ id: string; ownerId: string }>;
      const ids = items.map((item) => item.id);

      expect(ids).toContain(myApproved.id);
      expect(ids).toContain(myRejected.id);
      expect(ids).not.toContain(theirProperty.id);
      expect(items.every((item) => item.ownerId === ownerId)).toBe(true);
    });
  });

  describe('GET /properties/:id (+ view counter)', () => {
    it('владелец смотрит своё REJECTED — виден, не 404', async () => {
      const { id } = await seedProperty({ moderationStatus: 'REJECTED' });

      const res = await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.id).toBe(id);
      expect(res.body.moderationStatus).toBe('REJECTED');
    });

    it('чужой юзер смотрит чужое REJECTED — 404', async () => {
      const { id } = await seedProperty({ moderationStatus: 'REJECTED' });

      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(404);
    });

    it('первый просмотр чужим юзером увеличивает viewsCount ровно на 1 (дедуп)', async () => {
      const { id } = await seedProperty({ viewsCount: 0 });

      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(200);

      const stored = await prisma.property.findUnique({ where: { id } });
      expect(stored?.viewsCount).toBe(1);
    });

    it('просмотр владельцем НЕ увеличивает viewsCount', async () => {
      const { id } = await seedProperty({ viewsCount: 5 });

      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const stored = await prisma.property.findUnique({ where: { id } });
      expect(stored?.viewsCount).toBe(5);
    });

    it('просмотр ADMINом НЕ увеличивает viewsCount', async () => {
      const { id } = await seedProperty({ viewsCount: 3 });

      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stored = await prisma.property.findUnique({ where: { id } });
      expect(stored?.viewsCount).toBe(3);
    });

    it('несуществующий id — 404', async () => {
      await request(app.getHttpServer())
        .get('/properties/clx0000000000000000000000')
        .set('Authorization', `Bearer ${bookerToken}`)
        .expect(404);
    });
  });
});
