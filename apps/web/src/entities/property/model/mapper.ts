import type { PropertyResponseDto } from '@domly/shared';
import type { Property } from './types';

export function toProperty(dto: PropertyResponseDto): Property {
  return {
    id: dto.id,
    ownerId: dto.ownerId,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    dealType: dto.dealType,
    status: dto.status,
    price: dto.price,
    pricePerNight: dto.pricePerNight,
    minStayNights: dto.minStayNights,
    hasDeposit: dto.hasDeposit,
    effectivePrice: dto.effectivePrice,
    area: dto.area,
    address: dto.address,
    photos: dto.photos,
    viewsCount: dto.viewsCount,
    districtName: dto.districtName,
    cityName: dto.cityName,
    createdAt: dto.createdAt,
  };
}