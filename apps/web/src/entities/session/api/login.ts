import type { AuthUserDto, LoginDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";

export async function login(
  dto: LoginDto,
): Promise<{ user: AuthUserDto; accessToken: string }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: dto,
    skipAuthRetry: true,
  });
}