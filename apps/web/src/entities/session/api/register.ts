import type { AuthUserDto, RegisterDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { useSessionStore } from "@/shared/session/store";

export async function register(dto: RegisterDto): Promise<AuthUserDto> {
  const result = await apiFetch<{ user: AuthUserDto; accessToken: string }>(
    "/auth/register",
    { method: "POST", body: dto },
  );
  useSessionStore.getState().setSession(result.accessToken, result.user);
  return result.user;
}