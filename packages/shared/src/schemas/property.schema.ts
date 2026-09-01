import { z } from "zod";

export const PropertyCategoryEnum = z.enum([
  "APARTMENT",
  "HOUSE",
  "ROOM",
  "GARAGE",
]);
export const DealTypeEnum = z.enum(["SALE", "LONG_TERM_RENT", "DAILY_RENT"]);

const basePropertyFields = {
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  category: PropertyCategoryEnum,
  area: z.number().positive().max(10000),
  address: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photos: z.array(z.string().url()).min(1).max(20),
  districtId: z.string().cuid(),
};

const SalePropertySchema = z.object({
  ...basePropertyFields,
  dealType: z.literal("SALE"),
  price: z.number().int().positive(),
});

const LongTermRentPropertySchema = z.object({
  ...basePropertyFields,
  dealType: z.literal("LONG_TERM_RENT"),
  price: z.number().int().positive(),
  hasDeposit: z.boolean(),
});

const DailyRentPropertySchema = z.object({
  ...basePropertyFields,
  dealType: z.literal("DAILY_RENT"),
  pricePerNight: z.number().int().positive(),
  minStayNights: z.number().int().min(1),
});

export const CreatePropertySchema = z.discriminatedUnion("dealType", [
  SalePropertySchema,
  LongTermRentPropertySchema,
  DailyRentPropertySchema,
]);

export const UpdatePropertySchema = CreatePropertySchema;

export type CreatePropertyDto = z.infer<typeof CreatePropertySchema>;

const propertyQueryBaseSchema = z.object({
  dealType: DealTypeEnum.optional(),
  category: PropertyCategoryEnum.optional(),
  districtId: z.string().cuid().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  areaMin: z.coerce.number().positive().optional(),
  areaMax: z.coerce.number().positive().optional(),
  sortBy: z.enum(["price", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const validatePriceRange = (
  data: { priceMin?: number; priceMax?: number },
) => !data.priceMin || !data.priceMax || data.priceMin <= data.priceMax;

const priceRangeIssue = {
  message: "priceMin must be <= priceMax",
  path: ["priceMin"],
};

export const PropertyQuerySchema = propertyQueryBaseSchema.refine(
  validatePriceRange,
  priceRangeIssue,
);

export type PropertyQueryDto = z.infer<typeof PropertyQuerySchema>;

export const UpdateModerationStatusSchema = z.object({
  moderationStatus: z.enum(["APPROVED", "REJECTED"]),
});
export type UpdateModerationStatusDto = z.infer<typeof UpdateModerationStatusSchema>;

export const AdminPropertyQuerySchema = propertyQueryBaseSchema
  .extend({
    moderationStatus: z.enum(["APPROVED", "REJECTED"]).optional(),
  })
  .refine(validatePriceRange, priceRangeIssue);

export type AdminPropertyQueryDto = z.infer<typeof AdminPropertyQuerySchema>;
