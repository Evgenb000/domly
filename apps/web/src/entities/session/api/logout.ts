import { apiFetch } from "@/shared/api/apiFetch";
import { useSessionStore } from "@/shared/session/store";

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST", skipAuthRetry: true });
  } finally {
    useSessionStore.getState().clear();
  }
}