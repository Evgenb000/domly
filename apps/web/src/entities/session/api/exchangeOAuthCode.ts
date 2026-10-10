import type { OauthExchangeDto } from "@domly/shared";
import { apiFetch } from "@/shared/api/apiFetch";

const inFlightExchanges = new Map<string, Promise<string>>();

export function exchangeOAuthCode(code: string): Promise<string> {
  const existing = inFlightExchanges.get(code);
  if (existing) {
    return existing;
  }

  const promise = runExchange(code);
  inFlightExchanges.set(code, promise);
  return promise;
}

async function runExchange(code: string): Promise<string> {
  const dto: OauthExchangeDto = { code };
  const result = await apiFetch<{ accessToken: string }>(
    "/auth/oauth/exchange",
    { method: "POST", body: dto, skipAuthRetry: true },
  );
  return result.accessToken;
}