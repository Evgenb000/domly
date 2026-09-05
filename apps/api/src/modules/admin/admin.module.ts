import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RedisInfrastructureModule } from '../../infrastructure/redis/redis.module';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Module({
  imports: [
    UsersModule,
    PropertiesModule,
    PrismaModule,
    RedisInfrastructureModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AnalyticsRepository],
})
export class AdminModule {}
