"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { exchangeOAuthCode } from "@/entities/session";
import { getMe } from "@/shared/session/me";
import { useSessionStore } from "@/shared/session/store";

export function AuthCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [error, setError] = useState<string | null>(() =>
    code ? null : "Посилання недійсне",
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const authCode = code;

    async function handleAuth() {
      try {
        const accessToken = await exchangeOAuthCode(authCode);
        useSessionStore.getState().setSession(accessToken, null);
        const user = await getMe();
        useSessionStore.getState().setSession(accessToken, user);
        router.push("/");
      } catch {
        setError("Спробуйте увійти ще раз: посилання застаріло");
      }
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
            На сторінку входу
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Вхід через Google...</p>
      )}
    </div>
  );
}