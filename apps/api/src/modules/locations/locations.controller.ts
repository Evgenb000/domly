import { Controller, Get } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('districts')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  findAll() {
    return this.locationsService.findAllDistricts();
  }
}