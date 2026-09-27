import type { DistrictResponseDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import type { District } from "../model/types";

function toDistrict(dto: DistrictResponseDto): District {
  return { id: dto.id, name: dto.name, cityId: dto.cityId, cityName: dto.cityName };
}

export async function getDistricts(): Promise<District[]> {
  const data = await apiFetch<DistrictResponseDto[]>("/districts");
  return data.map(toDistrict);
}