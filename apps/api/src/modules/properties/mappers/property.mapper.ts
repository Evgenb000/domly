import type { PropertyResponseDto } from '@domly/shared';
import type { PropertyWithDistrict } from '../repositories/properties-repository.interface';

export function toPropertyResponse(property: PropertyWithDistrict): PropertyResponseDto {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    category: property.category,
    dealType: property.dealType,
    status: property.status,
    moderationStatus: property.moderationStatus,
    price: property.price,
    pricePerNight: property.pricePerNight,
    minStayNights: property.minStayNights,
    hasDeposit: property.hasDeposit,
    effectivePrice: property.effectivePrice,
    area: property.area,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    photos: property.photos,
    viewsCount: property.viewsCount,
    ownerId: property.ownerId,
    districtId: property.districtId,
    districtName: property.district.name,
    cityName: property.district.city.name,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}
