import type { PropertyResponseDto } from '@domly/shared';
import type { Property } from './types';

export function toProperty(dto: PropertyResponseDto): Property {
  return {
    id: dto.id,
    ownerId: dto.ownerId,
    ownerName: dto.ownerName,
    ownerRole: dto.ownerRole,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    dealType: dto.dealType,
    status: dto.status,
    moderationStatus: dto.moderationStatus,
    price: dto.price,
    pricePerNight: dto.pricePerNight,
    minStayNights: dto.minStayNights,
    hasDeposit: dto.hasDeposit,
    effectivePrice: dto.effectivePrice,
    area: dto.area,
    address: dto.address,
    latitude: dto.latitude,
    longitude: dto.longitude,
    photos: dto.photos,
    viewsCount: dto.viewsCount,
    districtId: dto.districtId,
    districtName: dto.districtName,
    cityName: dto.cityName,
    createdAt: dto.createdAt,
  };
}