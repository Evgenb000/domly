import type { PropertyQueryDto } from "@domly/shared";

export type PropertyFilterValues = Partial<
  Pick<
    PropertyQueryDto,
    "dealType" | "category" | "districtId" | "priceMin" | "priceMax" | "areaMin" | "areaMax"
  >
>;

export const EMPTY_FILTERS: PropertyFilterValues = {};