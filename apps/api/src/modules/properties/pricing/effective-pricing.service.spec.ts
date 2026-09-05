import type { CreatePropertyDto } from '@domly/shared';
import { EffectivePricingService } from './effective-pricing.service';
import { NightlyPriceStrategy } from './nightly-price.strategy';
import { StandardPriceStrategy } from './standard-price.strategy';

const baseFields = {
  title: 'Сучасна квартира біля парку',
  description: 'Світла квартира з новим ремонтом та сучасною технікою.',
  category: 'APARTMENT' as const,
  area: 60,
  latitude: 50.45,
  longitude: 30.52,
  photos: ['https://example.com/photo-1.jpg'],
  districtId: 'clx0000000000000000000000',
};

function saleDto(price: number): CreatePropertyDto {
  return { ...baseFields, dealType: 'SALE', price };
}

function longTermRentDto(price: number): CreatePropertyDto {
  return { ...baseFields, dealType: 'LONG_TERM_RENT', price, hasDeposit: true };
}

function dailyRentDto(pricePerNight: number): CreatePropertyDto {
  return {
    ...baseFields,
    dealType: 'DAILY_RENT',
    pricePerNight,
    minStayNights: 2,
  };
}

describe('StandardPriceStrategy', () => {
  const strategy = new StandardPriceStrategy();

  it.each([
    { dealType: 'SALE', dto: saleDto(250000), expected: 250000 },
    { dealType: 'LONG_TERM_RENT', dto: longTermRentDto(15000), expected: 15000 },
  ] as const)('supports $dealType and returns price as is', ({ dto, expected }) => {
    expect(strategy.supports(dto.dealType)).toBe(true);
    expect(strategy.calculate(dto)).toBe(expected);
  });

  it('returns the exact price field value for SALE', () => {
    const dto = saleDto(250000);
    if (dto.dealType === 'SALE') {
      expect(strategy.calculate(dto)).toBe(dto.price);
    }
  });

  it('does not support DAILY_RENT', () => {
    expect(strategy.supports('DAILY_RENT')).toBe(false);
  });

  it('throws for unsupported deal type', () => {
    expect(() => strategy.calculate(dailyRentDto(1200))).toThrow(
      'StandardPriceStrategy received unsupported dealType',
    );
  });
});

describe('NightlyPriceStrategy', () => {
  const strategy = new NightlyPriceStrategy();

  it('supports DAILY_RENT', () => {
    expect(strategy.supports('DAILY_RENT')).toBe(true);
  });

  it('does not support SALE or LONG_TERM_RENT', () => {
    expect(strategy.supports('SALE')).toBe(false);
    expect(strategy.supports('LONG_TERM_RENT')).toBe(false);
  });

  it('returns pricePerNight as effective price', () => {
    const dto = dailyRentDto(1200);
    if (dto.dealType === 'DAILY_RENT') {
      expect(strategy.calculate(dto)).toBe(dto.pricePerNight);
    }
    expect(strategy.calculate(dto)).toBe(1200);
  });

  it('throws for unsupported deal type', () => {
    expect(() => strategy.calculate(saleDto(250000))).toThrow(
      'NightlyPriceStrategy received unsupported dealType',
    );
  });
});

describe('EffectivePricingService', () => {
  const service = new EffectivePricingService([
    new StandardPriceStrategy(),
    new NightlyPriceStrategy(),
  ]);

  it.each([
    {
      dealType: 'SALE',
      dto: saleDto(250000),
      expected: 250000,
    },
    {
      dealType: 'LONG_TERM_RENT',
      dto: longTermRentDto(15000),
      expected: 15000,
    },
    {
      dealType: 'DAILY_RENT',
      dto: dailyRentDto(1200),
      expected: 1200,
    },
  ] as const)(
    'selects strategy for $dealType and returns effective price',
    ({ dto, expected }) => {
      expect(service.calculate(dto)).toBe(expected);
    },
  );
});