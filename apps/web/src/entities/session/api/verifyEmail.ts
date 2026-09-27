import { apiFetch } from "@/shared/api/apiFetch";

export async function verifyEmail(
  token: string,
): Promise<{ message: string }> {
  return apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
    skipAuthRetry: true,
  });
}