import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DistrictResponseSchema } from '@domly/shared';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/prisma/prisma.service';
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';

jest.setTimeout(120000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /districts — 200, массив, элементы соответствуют DistrictResponseSchema', async () => {
    const prisma = app.get(PrismaService);
    let createdCityId: string | null = null;
    let createdDistrictId: string | null = null;

    try {
      const existing = await prisma.district.findFirst({ include: { city: true } });

      if (!existing) {
        const city = await prisma.city.create({
          data: { name: `E2E City ${Date.now()}` },
        });
        createdCityId = city.id;

        const district = await prisma.district.create({
          data: { name: `E2E District ${Date.now()}`, cityId: city.id },
          include: { city: true },
        });
        createdDistrictId = district.id;
      }

      const res = await request(app.getHttpServer()).get('/districts').expect(200);

      expect(res.body).toEqual(expect.any(Array));
      expect(res.body.length).toBeGreaterThan(0);

      for (const item of res.body) {
        expect(DistrictResponseSchema.safeParse(item).success).toBe(true);
      }
    } finally {
      if (createdDistrictId) {
        await prisma.district.delete({ where: { id: createdDistrictId } });
      }
      if (createdCityId) {
        await prisma.city.delete({ where: { id: createdCityId } });
      }
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
