import {
  CreatePropertySchema,
  PropertyQuerySchema,
  UpdatePropertySchema,
  type CreatePropertyDto,
  type PropertyQueryDto,
} from '@domly/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { PropertyOwnershipGuard } from './guards/property-ownership.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PropertiesService } from './properties.service';

@Controller('properties')
@UseGuards(JwtAccessGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findMany(
    @Query(new ZodValidationPipe(PropertyQuerySchema)) query: PropertyQueryDto,
  ) {
    return this.propertiesService.findMany(query);
  }

  @Get('my')
  async findMyProperties(@CurrentUser() currentUser: CurrentUserPayload) {
    const query = PropertyQuerySchema.parse({});
    return this.propertiesService.findMyProperties(currentUser.id, query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.propertiesService.findOne(id, currentUser);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreatePropertySchema)) dto: CreatePropertyDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.propertiesService.create(dto, currentUser.id);
  }

  @Patch(':id')
  @UseGuards(PropertyOwnershipGuard)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePropertySchema)) dto: CreatePropertyDto,
  ) {
    return this.propertiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PropertyOwnershipGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.propertiesService.remove(id);
  }
}
