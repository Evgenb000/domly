import type {
  AdminPropertyQueryDto,
  CreatePropertyDto,
  PropertyQueryDto,
} from '@domly/shared';
import { Prisma } from '@prisma/client';

export type PropertyWithDistrict = Prisma.PropertyGetPayload<{
  include: {
    district: { include: { city: true } };
    owner: { select: { name: true, role: true } };
  };
}>;

export interface PropertyCreateInput {
  data: CreatePropertyDto;
  ownerId: string;
  effectivePrice: number;
}

export interface PropertyUpdateInput {
  data: CreatePropertyDto;
  effectivePrice: number;
}

export interface PaginatedProperties {
  items: PropertyWithDistrict[];
  total: number;
}

export const PROPERTIES_REPOSITORY = Symbol('PROPERTIES_REPOSITORY');

export interface IPropertiesRepository {
  findMany(query: PropertyQueryDto): Promise<PaginatedProperties>;
  findManyByOwner(
    ownerId: string,
    query: PropertyQueryDto,
  ): Promise<PaginatedProperties>;
  findManyForAdmin(query: AdminPropertyQueryDto): Promise<PaginatedProperties>;
  findById(id: string): Promise<PropertyWithDistrict | null>;
  create(input: PropertyCreateInput): Promise<PropertyWithDistrict>;
  update(id: string, input: PropertyUpdateInput): Promise<PropertyWithDistrict>;
  delete(id: string): Promise<void>;
  incrementViews(id: string): Promise<void>;
  updateModerationStatus(
    id: string,
    moderationStatus: 'APPROVED' | 'REJECTED',
  ): Promise<PropertyWithDistrict>;
}
