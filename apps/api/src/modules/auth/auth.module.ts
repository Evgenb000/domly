import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RedisInfrastructureModule } from '../../infrastructure/redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserRegisteredListener } from './listeners/user-registered.listener';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    JwtModule.register({}),
    NotificationsModule,
    RedisInfrastructureModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    UserRegisteredListener,
  ],
  exports: [JwtAccessStrategy, JwtRefreshStrategy, AuthRepository],
})
export class AuthModule {}
