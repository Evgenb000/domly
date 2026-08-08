import type { CreatePropertyDto } from '@domly/shared';
import { Injectable } from '@nestjs/common';
import {
  DealType,
  IEffectivePriceStrategy,
} from './effective-price-strategy.interface';

@Injectable()
export class StandardPriceStrategy implements IEffectivePriceStrategy {
  supports(dealType: DealType): boolean {
    return dealType === 'SALE' || dealType === 'LONG_TERM_RENT';
  }

  calculate(dto: CreatePropertyDto): number {
    if (dto.dealType !== 'SALE' && dto.dealType !== 'LONG_TERM_RENT') {
      throw new Error('StandardPriceStrategy received unsupported dealType');
    }
    return dto.price;
  }
}
