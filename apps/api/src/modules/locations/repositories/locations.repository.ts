import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  DistrictWithCity,
  ILocationsRepository,
} from './locations-repository.interface';

@Injectable()
export class LocationsRepository implements ILocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDistricts(): Promise<DistrictWithCity[]> {
    const districts = await this.prisma.district.findMany({
      include: { city: true },
      orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
    });

    return districts.map((district) => ({
      id: district.id,
      name: district.name,
      cityId: district.cityId,
      cityName: district.city.name,
    }));
  }
}