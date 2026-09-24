import type { Property } from './types';

type PriceLabelStrategy = (property: Property) => { amount: number; suffix: string | null };

const strategies: Record<Property['dealType'], PriceLabelStrategy> = {
  SALE: (property) => ({ amount: property.effectivePrice, suffix: null }),
  LONG_TERM_RENT: (property) => ({ amount: property.effectivePrice, suffix: '/ міс.' }),
  DAILY_RENT: (property) => ({ amount: property.effectivePrice, suffix: '/ ніч' }),
};

export function getPriceLabel(property: Property): { amount: number; suffix: string | null } {
  return strategies[property.dealType](property);
}