import type { AuthUserDto } from "@domly/shared";
import { apiFetch } from "../api/apiFetch";

export function getMe(): Promise<AuthUserDto> {
  return apiFetch<AuthUserDto>("/auth/me");
}