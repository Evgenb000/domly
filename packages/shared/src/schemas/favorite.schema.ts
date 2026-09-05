import { z } from "zod";
import { PropertyResponseSchema } from "./property.schema";

export const CreateFavoriteSchema = z.object({
  propertyId: z.string().cuid(),
});
export type CreateFavoriteDto = z.infer<typeof CreateFavoriteSchema>;

export const FavoriteResponseSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  property: PropertyResponseSchema,
  createdAt: z.string(),
});
export type FavoriteResponseDto = z.infer<typeof FavoriteResponseSchema>;
