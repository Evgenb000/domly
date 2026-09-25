import type { PropertyQueryDto, PropertyResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toProperty } from "../model/mapper";
import type { PaginationMeta, Property } from "../model/types";

export interface GetPropertiesParams {
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