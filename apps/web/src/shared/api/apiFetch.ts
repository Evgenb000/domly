import { ApiError, ApiErrorBody } from "./types";
import { getApiBaseUrl } from "./url";
import { useSessionStore } from "../session/store";
import { refreshSession } from "../session/refresh";

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

const AUTH_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/oauth/exchange",
]);

function buildHeaders(headers?: HeadersInit): Record<string, string> {
  const accessToken = useSessionStore.getState().accessToken;
  const merged: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (headers) {
    Object.assign(merged, headers);
  }
  if (accessToken) {
    merged.Authorization = `Bearer ${accessToken}`;
  }
  return merged;
}

async function execute(
  path: string,
  options: ApiFetchOptions,
): Promise<Response> {
  const { body, headers, skipAuthRetry: _skipAuthRetry, ...rest } = options;
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    credentials: "include",
    headers: buildHeaders(headers),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function throwApiError(response: Response): Promise<never> {
  const errorBody = (await response.json()) as ApiErrorBody;
  throw new ApiError(errorBody);
}

export async function apiFetch<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  const { skipAuthRetry = false } = options;

  let response = await execute(path, options);

  if (
    response.status === 401 &&
    !skipAuthRetry &&
    !AUTH_ENDPOINTS.has(path)
  ) {
    const refreshed = await refreshSession().catch(() => null);
    if (refreshed) {
      response = await execute(path, options);
    } else {
      useSessionStore.getState().clear();
    }
  }

  if (!response.ok) {
    await throwApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}