import type { PropertyResponseDto } from '@domly/shared';

export type PropertyCategory = PropertyResponseDto['category'];
export type PropertyDealType = PropertyResponseDto['dealType'];
export type PropertyStatus = PropertyResponseDto['status'];
export type PropertyOwnerRole = PropertyResponseDto['ownerRole'];
export type PropertyModerationStatus = PropertyResponseDto['moderationStatus'];

export interface Property {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerRole: PropertyOwnerRole;
  title: string;
  description: string;
  category: PropertyCategory;
  dealType: PropertyDealType;
  status: PropertyStatus;
  moderationStatus: PropertyModerationStatus;
  price: number | null;
  pricePerNight: number | null;
  minStayNights: number | null;
  hasDeposit: boolean | null;
  effectivePrice: number;
  area: number;
  address: string | null;
  latitude: number;
  longitude: number;
  photos: string[];
  viewsCount: number;
  districtId: string;
  districtName: string;
  cityName: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}