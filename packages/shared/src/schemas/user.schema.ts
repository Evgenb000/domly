import { z } from "zod";

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["USER", "REALTOR", "DEVELOPER", "ADMIN"]),
});
export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;

export const SetUserBlockedSchema = z.object({
  isBlocked: z.boolean(),
});
export type SetUserBlockedDto = z.infer<typeof SetUserBlockedSchema>;

export const AdminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(["USER", "REALTOR", "DEVELOPER", "ADMIN"]).optional(),
  isBlocked: z.coerce.boolean().optional(),
});
export type AdminUserQueryDto = z.infer<typeof AdminUserQuerySchema>;

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["USER", "REALTOR", "DEVELOPER", "ADMIN"]),
  emailVerified: z.boolean(),
  isBlocked: z.boolean(),
  createdAt: z.string(),
});
export type UserResponseDto = z.infer<typeof UserResponseSchema>;