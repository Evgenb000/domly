import { Inject, Injectable } from '@nestjs/common';
import type { DistrictResponseDto } from '@domly/shared';
import {
  ILocationsRepository,
  LOCATIONS_REPOSITORY,
} from './repositories/locations-repository.interface';

@Injectable()
export class LocationsService {
  constructor(
    @Inject(LOCATIONS_REPOSITORY)
    private readonly locationsRepository: ILocationsRepository,
  ) {}

  findAllDistricts(): Promise<DistrictResponseDto[]> {
    return this.locationsRepository.findAllDistricts();
  }
}