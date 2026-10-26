import type { CreatePropertyDto, PropertyResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toProperty } from "../model/mapper";
import type { Property } from "../model/types";

export async function updateProperty(id: string, dto: CreatePropertyDto): Promise<Property> {
  const data = await apiFetch<PropertyResponseDto>(`/properties/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: dto,
  });
  return toProperty(data);
}
