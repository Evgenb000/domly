import type { PropertyQueryDto, PropertyResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toProperty } from "../model/mapper";
import type { PaginationMeta, Property } from "../model/types";

export interface GetPropertiesParams {
  dealType?: PropertyQueryDto["dealType"];
  category?: PropertyQueryDto["category"];
  districtId?: PropertyQueryDto["districtId"];
  priceMin?: PropertyQueryDto["priceMin"];
  priceMax?: PropertyQueryDto["priceMax"];
  areaMin?: PropertyQueryDto["areaMin"];
  areaMax?: PropertyQueryDto["areaMax"];
  sortBy?: PropertyQueryDto["sortBy"];
  sortOrder?: PropertyQueryDto["sortOrder"];
  page?: number;
  limit?: number;
}

export interface GetPropertiesResult {
  items: Property[];
  meta: PaginationMeta;
}

interface GetPropertiesResponse {
  items: PropertyResponseDto[];
  meta: PaginationMeta;
}

export async function getProperties(
  params: GetPropertiesParams = {},
): Promise<GetPropertiesResult> {
  const searchParams = new URLSearchParams();
  if (params.dealType) searchParams.set("dealType", params.dealType);
  if (params.category) searchParams.set("category", params.category);
  if (params.districtId) searchParams.set("districtId", params.districtId);
  if (params.priceMin !== undefined) searchParams.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined) searchParams.set("priceMax", String(params.priceMax));
  if (params.areaMin !== undefined) searchParams.set("areaMin", String(params.areaMin));
  if (params.areaMax !== undefined) searchParams.set("areaMax", String(params.areaMax));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const data = await apiFetch<GetPropertiesResponse>(
    `/properties${query ? `?${query}` : ""}`,
  );

  return {
    items: data.items.map(toProperty),
    meta: data.meta,
  };
}