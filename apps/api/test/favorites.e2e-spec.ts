import { FavoriteResponseSchema } from '@domly/shared';
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
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { hashValue } from '../src/common/utils/hash.util';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const FIXED_PASSWORD = 'E2ePassword123!';

jest.setTimeout(120000);

describe('Favorites (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerId: string;
  let favoriterId: string;
  let favoriterToken: string;
  let otherUserToken: string;
  let districtId: string;
  let propertyId: string;

  const createdUserIds: string[] = [];

  async function createUser(label: string) {
    const passwordHash = await hashValue(FIXED_PASSWORD);
    const user = await prisma.user.create({
      data: {
        email: `e2e-fav-${label}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}@test.local`,
        name: `E2E Favorites ${label}`,
        passwordHash,
        emailVerified: true,
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function signToken(user: { id: string; role: string }) {
    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    const accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    return jwtService.signAsync(
      { sub: user.id, role: user.role },
      { secret: accessSecret },
    );
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const owner = await createUser('owner');
    const favoriter = await createUser('favoriter');
    const otherUser = await createUser('other');

    ownerId = owner.id;
    favoriterId = favoriter.id;

    let district = await prisma.district.findFirst({
      include: { city: true },
    });

    if (!district) {
      const city = await prisma.city.create({
        data: { name: `E2E Favorites City ${Date.now()}` },
      });
      district = await prisma.district.create({
        data: {
          name: `E2E Favorites District ${Date.now()}`,
          cityId: city.id,
        },
        include: { city: true },
      });
    }

    districtId = district.id;

    const property = await prisma.property.create({
      data: {
        title: 'E2E Favorites Property',
        description: 'E2E test property description for favorites tests.',
        category: 'APARTMENT',
        dealType: 'SALE',
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        price: 200000,
        effectivePrice: 200000,
        area: 55,
        latitude: 50.45,
        longitude: 30.52,
        photos: ['https://picsum.photos/seed/e2e-favorites/900/650'],
        ownerId,
        districtId,
      },
    });

    propertyId = property.id;

    favoriterToken = await signToken(favoriter);
    otherUserToken = await signToken(otherUser);
  });

  afterEach(async () => {
    await prisma.favorite.deleteMany({ where: { propertyId } });
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  it('setup works', () => {
    expect(true).toBe(true);
  });

  describe('POST /favorites', () => {
    it('добавляет объект в избранное — 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId })
        .expect(200);

      const parsed = FavoriteResponseSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.propertyId).toBe(propertyId);

      const inDb = await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId: favoriterId, propertyId } },
      });
      expect(inDb).not.toBeNull();
    });

    it('идемпотентен: повторный POST не создаёт дубль', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId })
        .expect(200);

      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId })
        .expect(200);

      const count = await prisma.favorite.count({
        where: { userId: favoriterId, propertyId },
      });
      expect(count).toBe(1);
    });

    it('невалидный propertyId (не cuid) — 400', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId: 'f4437a9e-c96a-4ed5-bbb0-d54cfe3c598f' })
        .expect(400);
    });

    it('валидный cuid несуществующего объекта — 404', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId: 'c000000000000000000000000' })
        .expect(404);
    });

    it('без токена — 401', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .send({ propertyId })
        .expect(401);
    });
  });

  describe('GET /favorites/my', () => {
    it('возвращает добавленный объект, формат проходит схему', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/favorites/my')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .expect(200);

      const parsed = FavoriteResponseSchema.array().safeParse(res.body);
      expect(parsed.success).toBe(true);
      const ids = parsed.data!.map((f) => f.propertyId);
      expect(ids).toContain(propertyId);
    });

    it('скоуп по пользователю: избранное одного не видно другому', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/favorites/my')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      const parsed = FavoriteResponseSchema.array().safeParse(res.body);
      expect(parsed.success).toBe(true);
      const ids = parsed.data!.map((f) => f.propertyId);
      expect(ids).not.toContain(propertyId);
    });
  });

  describe('DELETE /favorites/:propertyId', () => {
    it('удаляет объект из избранного — 204', async () => {
      await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .send({ propertyId })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/favorites/${propertyId}`)
        .set('Authorization', `Bearer ${favoriterToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get('/favorites/my')
        .set('Authorization', `Bearer ${favoriterToken}`)
        .expect(200);

      const ids = (res.body as { propertyId: string }[]).map(
        (f) => f.propertyId,
      );
      expect(ids).not.toContain(propertyId);
    });
  });
});
