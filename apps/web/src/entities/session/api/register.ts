import type { AuthUserDto, RegisterDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";

export async function register(
  dto: RegisterDto,
): Promise<{ user: AuthUserDto; accessToken: string }> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: dto,
    skipAuthRetry: true,
  });
}