import type { PropertyQueryDto } from '@domly/shared';
import type { Property } from '@prisma/client';

export const PROPERTIES_REPOSITORY = Symbol('PROPERTIES_REPOSITORY');

export interface IPropertiesRepository {
  findMany(
    query: PropertyQueryDto,
  ): Promise<{ items: Property[]; total: number }>;
  findManyByOwner(
    ownerId: string,
    query: PropertyQueryDto,
  ): Promise<{ items: Property[]; total: number }>;
  findById(id: string): Promise<Property | null>;
  create(data: {
    data: any;
    ownerId: string;
    effectivePrice: number;
  }): Promise<Property>;
  update(
    id: string,
    data: {
      data: any;
      effectivePrice: number;
    },
  ): Promise<Property>;
  delete(id: string): Promise<void>;
}
