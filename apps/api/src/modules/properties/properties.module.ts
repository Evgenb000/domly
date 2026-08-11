import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PropertyOwnershipGuard } from './guards/property-ownership.guard';
import {
  EFFECTIVE_PRICE_STRATEGIES,
  type IEffectivePriceStrategy,
} from './pricing/effective-price-strategy.interface';
import { EffectivePricingService } from './pricing/effective-pricing.service';
import { NightlyPriceStrategy } from './pricing/nightly-price.strategy';
import { StandardPriceStrategy } from './pricing/standard-price.strategy';
import { PropertiesService } from './properties.service';
import { PROPERTIES_REPOSITORY } from './repositories/properties-repository.interface';
import { PropertiesRepository } from './repositories/properties.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: PROPERTIES_REPOSITORY, useClass: PropertiesRepository },
    StandardPriceStrategy,
    NightlyPriceStrategy,
    {
      provide: EFFECTIVE_PRICE_STRATEGIES,
      useFactory: (
        standard: StandardPriceStrategy,
        nightly: NightlyPriceStrategy,
      ): IEffectivePriceStrategy[] => [standard, nightly],
      inject: [StandardPriceStrategy, NightlyPriceStrategy],
    },
    EffectivePricingService,
    PropertiesService,
    PropertyOwnershipGuard,
  ],
  controllers: [],
  exports: [PropertiesService],
})
export class PropertiesModule {}
