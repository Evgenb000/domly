import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import { TWENTY_FOUR_HOURS_MS } from '../../common/constants/time.constants';
import { compareValue, hashValue } from '../../common/utils/hash.util';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
  ) {
    this.accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExpiry =
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRY');
    this.refreshExpiry =
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRY');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async register(dto: { email: string; password: string; name: string }) {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await hashValue(dto.password);
    const user = await this.authRepository.createUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    const tokens = await this.issueTokens(user.id, user.role);

    this.eventEmitter.emit('user.registered', {
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await compareValue(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string, payload: { sub: string; jti: string }) {
    const storedToken = await this.authRepository.findRefreshTokenById(
      payload.jti,
    );
    if (
      !storedToken ||
      storedToken.revokedAt !== null ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    if (tokenHash !== storedToken.tokenHash) {
      await this.authRepository.revokeAllUserRefreshTokens(payload.sub);
      throw new UnauthorizedException('Token compromised');
    }

    const user = await this.authRepository.findById(payload.sub);
    if (!user || user.isBlocked) {
      throw new UnauthorizedException();
    }

    await this.authRepository.revokeRefreshToken(storedToken.id);
    const tokens = await this.issueTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async logout(jti: string) {
    await this.authRepository.revokeRefreshToken(jti);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.authRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new NotFoundException('Verification token not found');
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new GoneException('Verification token has expired');
    }

    if (user.emailVerified) {
      return;
    }

    await this.authRepository.verifyEmail(user.id);
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);

    await this.authRepository.setEmailVerificationToken(
      userId,
      token,
      expiresAt,
    );

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    await this.notificationsService.queueEmail({
      type: 'EMAIL_VERIFICATION',
      to: user.email,
      name: user.name,
      verificationUrl,
    });
  }

  private async issueTokens(userId: string, role: string) {
    const refreshTokenId = crypto.randomUUID();

    const accessExpirySeconds = this.parseExpiryToSeconds(this.accessExpiry);
    const refreshExpirySeconds = this.parseExpiryToSeconds(this.refreshExpiry);

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role },
      { secret: this.accessSecret, expiresIn: accessExpirySeconds },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti: refreshTokenId },
      { secret: this.refreshSecret, expiresIn: refreshExpirySeconds },
    );

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

    await this.authRepository.createRefreshToken({
      id: refreshTokenId,
      userId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}
