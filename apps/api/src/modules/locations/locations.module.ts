import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LOCATIONS_REPOSITORY } from './repositories/locations-repository.interface';
import { LocationsRepository } from './repositories/locations.repository';

@Module({
  imports: [PrismaModule],
  controllers: [LocationsController],
  providers: [{ provide: LOCATIONS_REPOSITORY, useClass: LocationsRepository }],
})
export class LocationsModule {}