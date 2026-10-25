import type { PropertyResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toProperty } from "../model/mapper";
import type { PaginationMeta, Property } from "../model/types";

interface GetMyPropertiesResponse {
  items: PropertyResponseDto[];
  meta: PaginationMeta;
}

export async function getMyProperties(
  page: number,
  limit = 10,
): Promise<{ items: Property[]; meta: PaginationMeta }> {
  const data = await apiFetch<GetMyPropertiesResponse>(
    `/properties/my?page=${page}&limit=${limit}`,
  );
  return {
    items: data.items.map(toProperty),
    meta: data.meta,
  };
}
