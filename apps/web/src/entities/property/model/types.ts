import type { PropertyResponseDto } from '@domly/shared';

export type PropertyCategory = PropertyResponseDto['category'];
export type PropertyDealType = PropertyResponseDto['dealType'];
export type PropertyStatus = PropertyResponseDto['status'];

export interface Property {
  id: string;
  title: string;
  description: string;
  category: PropertyCategory;
  dealType: PropertyDealType;
  status: PropertyStatus;
  price: number | null;
  pricePerNight: number | null;
  minStayNights: number | null;
  hasDeposit: boolean | null;
  effectivePrice: number;
  area: number;
  address: string | null;
  photos: string[];
  viewsCount: number;
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