import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FAVORITES_REPOSITORY } from './repositories/favorites-repository.interface';
import { FavoritesRepository } from './repositories/favorites.repository';

@Module({
  controllers: [FavoritesController],
  providers: [
    FavoritesService,
    { provide: FAVORITES_REPOSITORY, useClass: FavoritesRepository },
  ],
  exports: [FavoritesService],
})
export class FavoritesModule {}