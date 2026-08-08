import type { CreatePropertyDto } from '@domly/shared';
import { Injectable } from '@nestjs/common';
import {
  DealType,
  IEffectivePriceStrategy,
} from './effective-price-strategy.interface';

@Injectable()
export class NightlyPriceStrategy implements IEffectivePriceStrategy {
  supports(dealType: DealType): boolean {
    return dealType === 'DAILY_RENT';
  }

  calculate(dto: CreatePropertyDto): number {
    if (dto.dealType !== 'DAILY_RENT') {
      throw new Error('NightlyPriceStrategy received unsupported dealType');
    }
    return dto.pricePerNight;
  }
}
