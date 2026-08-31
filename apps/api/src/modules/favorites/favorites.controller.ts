import {
  CreateFavoriteSchema,
  type CreateFavoriteDto,
} from '@domly/shared';
import {
  Controller,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAccessGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @Body(new ZodValidationPipe(CreateFavoriteSchema)) dto: CreateFavoriteDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.favoritesService.create(currentUser.id, dto.propertyId);
  }

  @Delete(':propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('propertyId') propertyId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.favoritesService.remove(currentUser.id, propertyId);
  }

  @Get('my')
  async findMyFavorites(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.favoritesService.findMyFavorites(currentUser.id);
  }
}