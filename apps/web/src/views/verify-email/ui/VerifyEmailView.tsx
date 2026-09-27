"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/entities/session";

type State = "loading" | "success" | "error";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(() =>
    token ? "loading" : "error",
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (startedRef.current) return;
    startedRef.current = true;

    verifyEmail(token)
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
      {state === "loading" ? (
        <p className="text-sm text-muted-foreground">Підтверджуємо email...</p>
      ) : state === "success" ? (
        <>
          <p className="text-base font-medium text-foreground">
            Email підтверджено
          </p>
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Увійти
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-destructive">
            Посилання недійсне або застаріле
          </p>
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            На сторінку входу
          </Link>
        </>
      )}
    </div>
  );
}