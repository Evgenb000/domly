import type { AuthUserDto, LoginDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { useSessionStore } from "@/shared/session/store";

export async function login(dto: LoginDto): Promise<AuthUserDto> {
  const result = await apiFetch<{ user: AuthUserDto; accessToken: string }>(
    "/auth/login",
    { method: "POST", body: dto },
  );
  useSessionStore.getState().setSession(result.accessToken, result.user);
  return result.user;
}