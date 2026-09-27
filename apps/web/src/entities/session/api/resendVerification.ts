import { apiFetch } from "@/shared/api/apiFetch";

export async function resendVerification(): Promise<{ message: string }> {
  return apiFetch("/auth/resend-verification", { method: "POST" });
}