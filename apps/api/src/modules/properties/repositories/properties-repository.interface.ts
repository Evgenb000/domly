import type { CreatePropertyDto, PropertyQueryDto } from '@domly/shared';
import type { Property } from '@prisma/client';

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
  items: Property[];
  total: number;
}

export const PROPERTIES_REPOSITORY = Symbol('PROPERTIES_REPOSITORY');

export interface IPropertiesRepository {
  findMany(query: PropertyQueryDto): Promise<PaginatedProperties>;
  findManyByOwner(
    ownerId: string,
    query: PropertyQueryDto,
  ): Promise<PaginatedProperties>;
  findById(id: string): Promise<Property | null>;
  create(input: PropertyCreateInput): Promise<Property>;
  update(id: string, input: PropertyUpdateInput): Promise<Property>;
  delete(id: string): Promise<void>;
}
