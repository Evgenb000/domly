import type { CreatePropertyDto } from '@domly/shared';
import { Inject, Injectable } from '@nestjs/common';
import {
  EFFECTIVE_PRICE_STRATEGIES,
  IEffectivePriceStrategy,
} from './effective-price-strategy.interface';

@Injectable()
export class EffectivePricingService {
  constructor(
    @Inject(EFFECTIVE_PRICE_STRATEGIES)
    private readonly strategies: IEffectivePriceStrategy[],
  ) {}

  calculate(dto: CreatePropertyDto): number {
    const strategy = this.strategies.find((s) => s.supports(dto.dealType));
    if (!strategy) {
      throw new Error(
        `No effective price strategy registered for dealType: ${dto.dealType}`,
      );
    }
    return strategy.calculate(dto);
  }
}
