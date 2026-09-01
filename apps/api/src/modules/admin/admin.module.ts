import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, PropertiesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
