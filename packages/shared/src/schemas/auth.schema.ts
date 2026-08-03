import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(100),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailQuery = z.infer<typeof verifyEmailQuerySchema>;

export const oauthExchangeSchema = z.object({
  code: z.string().min(1),
});
export type OauthExchangeDto = z.infer<typeof oauthExchangeSchema>;
