"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { exchangeOAuthCode } from "@/entities/session";
import { getMe } from "@/shared/session/me";
import { useSessionStore } from "@/shared/session/store";
import { ApiError } from "@/shared/api/types";
import { AUTH_CALLBACK_STRINGS } from "../model/strings";

export function AuthCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [error, setError] = useState<string | null>(() =>
    code ? null : AUTH_CALLBACK_STRINGS.invalidLink,
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const authCode = code;

    async function handleAuth() {
      let accessToken: string;
      try {
        accessToken = await exchangeOAuthCode(authCode);
      } catch (err) {
        handleError(err, "exchange");
        return;
      }

      useSessionStore.getState().setSession(accessToken, null);

      try {
        const user = await getMe();
        useSessionStore.getState().setSession(accessToken, user);
        router.push("/");
      } catch (err) {
        handleError(err, "getMe");
      }
    }

    function handleError(err: unknown, stage: "exchange" | "getMe") {
      if (useSessionStore.getState().user) {
        router.replace("/");
        return;
      }

      if (
        stage === "exchange" &&
        err instanceof ApiError &&
        (err.statusCode === 400 || err.statusCode === 401)
      ) {
        setError(AUTH_CALLBACK_STRINGS.linkExpired);
        return;
      }

      setError(AUTH_CALLBACK_STRINGS.loginFailed);
    }

    void handleAuth();
  }, [code, router]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 px-4 text-center">
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {AUTH_CALLBACK_STRINGS.backToLogin}
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {AUTH_CALLBACK_STRINGS.loading}
        </p>
      )}
    </div>
  );
}