import { z } from "zod";

export const BookingStatusEnum = z.enum(["ACTIVE", "CANCELLED", "EXPIRED"]);

export const CreateBookingSchema = z.object({
  propertyId: z.string().cuid(),
});
export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;

export const BookingResponseSchema = z.object({
  id: z.string().cuid(),
  status: BookingStatusEnum,
  propertyId: z.string().cuid(),
  userId: z.string().cuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BookingResponseDto = z.infer<typeof BookingResponseSchema>;

export const BookingQuerySchema = z.object({
  status: BookingStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});
export type BookingQueryDto = z.infer<typeof BookingQuerySchema>;
