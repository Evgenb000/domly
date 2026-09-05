import type { PropertyResponseDto } from '@domly/shared';
import type { Property } from '@prisma/client';

export function toPropertyResponse(property: Property): PropertyResponseDto {
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
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}
