import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserRegisteredListener } from './listeners/user-registered.listener';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    UserRegisteredListener,
  ],
  exports: [JwtAccessStrategy, JwtRefreshStrategy, AuthRepository],
})
export class AuthModule {}
