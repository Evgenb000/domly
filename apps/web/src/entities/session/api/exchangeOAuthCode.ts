import type { OauthExchangeDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";
import { useSessionStore } from "@/shared/session/store";

export async function exchangeOAuthCode(code: string): Promise<string> {
  const dto: OauthExchangeDto = { code };
  const result = await apiFetch<{ accessToken: string }>(
    "/auth/oauth/exchange",
    { method: "POST", body: dto, skipAuthRetry: true },
  );
  const state = useSessionStore.getState();
  state.setSession(result.accessToken, null);
  return result.accessToken;
}