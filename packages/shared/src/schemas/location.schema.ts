import { z } from "zod";

export const DistrictResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  cityId: z.string(),
  cityName: z.string(),
});
export type DistrictResponseDto = z.infer<typeof DistrictResponseSchema>;