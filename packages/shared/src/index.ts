import { z } from "zod";

export const propertyDealTypeSchema = z.enum([
  "SALE",
  "LONG_TERM_RENT",
  "DAILY_RENT",
]);
export type PropertyDealType = z.infer<typeof propertyDealTypeSchema>;

export * from "./schemas/auth.schema";
