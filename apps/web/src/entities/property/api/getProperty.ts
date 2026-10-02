import type { PropertyResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toProperty } from "../model/mapper";
import type { Property } from "../model/types";

export async function getProperty(id: string): Promise<Property> {
  const data = await apiFetch<PropertyResponseDto>(`/properties/${encodeURIComponent(id)}`);
  return toProperty(data);
}