import { z } from "zod";
import { DealTypeEnum, PropertyCategoryEnum } from "./property.schema";

const PropertyStatusEnum = z.enum(["AVAILABLE", "RESERVED"]);

const FavoritePropertySchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  category: PropertyCategoryEnum,
  dealType: DealTypeEnum,
  status: PropertyStatusEnum,
  price: z.number().int().positive().nullable(),
  pricePerNight: z.number().int().positive().nullable(),
  minStayNights: z.number().int().min(1).nullable(),
  effectivePrice: z.number().int(),
  area: z.number().positive(),
  address: z.string().nullable(),
  districtId: z.string().cuid(),
  photos: z.array(z.string().url()),
});

export const CreateFavoriteSchema = z.object({
  propertyId: z.string().cuid(),
});
export type CreateFavoriteDto = z.infer<typeof CreateFavoriteSchema>;

export const FavoriteResponseSchema = z.object({
  id: z.string().cuid(),
  propertyId: z.string().cuid(),
  userId: z.string().cuid(),
  createdAt: z.string(),
  property: FavoritePropertySchema,
});
export type FavoriteResponseDto = z.infer<typeof FavoriteResponseSchema>;
