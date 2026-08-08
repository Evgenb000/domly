import { propertyDealTypeSchema, type CreatePropertyDto } from '@domly/shared';
import { z } from 'zod';

export type DealType = z.infer<typeof propertyDealTypeSchema>;

export const EFFECTIVE_PRICE_STRATEGIES = Symbol('EFFECTIVE_PRICE_STRATEGIES');

export interface IEffectivePriceStrategy {
  supports(dealType: DealType): boolean;
  calculate(dto: CreatePropertyDto): number;
}
