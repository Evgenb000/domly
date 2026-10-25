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
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';
import { PropertyOwnershipGuard } from './guards/property-ownership.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PropertiesService } from './properties.service';
import { toPropertyResponse } from './mappers/property.mapper';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findMany(
    @Query(new ZodValidationPipe(PropertyQuerySchema)) query: PropertyQueryDto,
  ) {
    const result = await this.propertiesService.findMany(query);
    return {
      items: result.items.map(toPropertyResponse),
      meta: result.meta,
    };
  }

  @Get('my')
  @UseGuards(JwtAccessGuard)
  async findMyProperties(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query(new ZodValidationPipe(PropertyQuerySchema)) query: PropertyQueryDto,
  ) {
    const result = await this.propertiesService.findMyProperties(
      currentUser.id,
      query,
    );
    return {
      items: result.items.map(toPropertyResponse),
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload | undefined,
  ) {
    const result = await this.propertiesService.findOne(id, currentUser);
    return toPropertyResponse(result);
  }

  @Post()
  @UseGuards(JwtAccessGuard)
  async create(
    @Body(new ZodValidationPipe(CreatePropertySchema)) dto: CreatePropertyDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const result = await this.propertiesService.create(dto, currentUser.id);
    return toPropertyResponse(result);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard, PropertyOwnershipGuard)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePropertySchema)) dto: CreatePropertyDto,
  ) {
    const result = await this.propertiesService.update(id, dto);
    return toPropertyResponse(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAccessGuard, PropertyOwnershipGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.propertiesService.remove(id);
  }
}
