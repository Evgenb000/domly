import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          url:
            configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class BullMqInfrastructureModule {}
