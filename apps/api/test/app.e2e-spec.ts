import { authUserSchema } from '@domly/shared';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { hashValue } from '../src/common/utils/hash.util';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

jest.setTimeout(120000);

const FIXED_PASSWORD = 'E2ePassword123!';
const UNIQUE = Date.now();

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NotificationsService)
      .useValue({ queueEmail: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    authService = app.get(AuthService);
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } },
    });
    await app.close();
  });

  async function createUser(
    overrides: { emailVerified?: boolean; role?: 'USER' | 'ADMIN' } = {},
  ) {
    const passwordHash = await hashValue(FIXED_PASSWORD);
    const user = await prisma.user.create({
      data: {
        email: `e2e-auth-${UNIQUE}-${createdUserIds.length}@test.local`,
        name: 'E2E Auth User',
        passwordHash,
        emailVerified: overrides.emailVerified ?? true,
        role: overrides.role ?? 'USER',
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function loginAccessToken(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: FIXED_PASSWORD })
      .expect(201);
    return res.body.accessToken as string;
  }

  describe('GET /auth/me', () => {
    it('login → /auth/me — 200 с корректным пользователем', async () => {
      const user = await createUser();
      const accessToken = await loginAccessToken(user.email);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const parsed = authUserSchema.safeParse(res.body);
      expect(parsed.success).toBe(true);
      expect(res.body.id).toBe(user.id);
      expect(res.body.email).toBe(user.email);
      expect(res.body.name).toBe(user.name);
      expect(res.body.role).toBe(user.role);
      expect(res.body.emailVerified).toBe(true);
    });

    it('без токена — 401', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('Google oauth exchange → /auth/me — 200 с корректным пользователем', async () => {
      const email = `e2e-auth-oauth-${UNIQUE}@test.local`;

      const { code } = await authService.handleGoogleCallback({
        googleId: `e2e-google-${UNIQUE}`,
        email,
        name: 'E2E OAuth User',
      });

      const exchangeRes = await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(201);

      const accessToken = exchangeRes.body.accessToken as string;
      expect(accessToken).toBeTruthy();

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const parsed = authUserSchema.safeParse(meRes.body);
      expect(parsed.success).toBe(true);
      expect(meRes.body.email).toBe(email);
      expect(meRes.body.emailVerified).toBe(true);

      const oauthUser = await prisma.user.findUnique({ where: { email } });
      expect(oauthUser).not.toBeNull();
      expect(meRes.body.id).toBe(oauthUser?.id);
      createdUserIds.push(oauthUser!.id);
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('авторизованный пользователь — не 500', async () => {
      const user = await createUser({ emailVerified: false });
      const accessToken = await loginAccessToken(user.email);

      const res = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).not.toBe(500);
      expect(res.status).toBe(200);
    });

    it('без токена — 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .expect(401);
    });
  });

  describe('access token без sub (защита стратегии)', () => {
    it('токен с невалидным payload — 401, не 500', async () => {
      const jwtService = app.get(JwtService);
      const configService = app.get(ConfigService);
      const accessSecret =
        configService.getOrThrow<string>('JWT_ACCESS_SECRET');
      const tokenWithoutSub = await jwtService.signAsync(
        { role: 'USER' },
        { secret: accessSecret },
      );

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenWithoutSub}`);

      expect(res.status).toBe(401);
    });
  });
});
