import type { CreatePropertyDto, PropertyResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { toProperty } from "../model/mapper";
import type { Property } from "../model/types";

export async function createProperty(dto: CreatePropertyDto): Promise<Property> {
  const data = await apiFetch<PropertyResponseDto>("/properties", {
    method: "POST",
    body: dto,
  });
  return toProperty(data);
}