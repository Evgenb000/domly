import { apiFetch } from "@/shared/api/apiFetch";

export async function logout(): Promise<void> {
  return apiFetch("/auth/logout", { method: "POST", skipAuthRetry: true });
}