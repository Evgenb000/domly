import type { AuthUserDto } from "@domly/shared";
import { ApiError, ApiErrorBody } from "../api/types";
import { getApiBaseUrl } from "../api/url";
import { useSessionStore } from "./store";

type RefreshResult = { accessToken: string; user: AuthUserDto | null } | null;

let refreshPromise: Promise<RefreshResult> | null = null;

function doRefresh(): Promise<RefreshResult> {
  return fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).then(async (response) => {
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) {
      const errorBody = (await response.json()) as ApiErrorBody;
      throw new ApiError(errorBody);
    }
    const data = (await response.json()) as {
      accessToken: string;
      user: AuthUserDto | null;
    };
    useSessionStore.getState().setSession(data.accessToken, data.user);
    return data;
  });
}

export function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}