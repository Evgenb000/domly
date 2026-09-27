"use client";

import Link from "next/link";
import { useSessionStore } from "@/shared/session/store";
import { LogoutButton } from "@/features/auth-logout";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "cn";

export function Header() {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Domly
      </Link>

      <div className="flex items-center gap-3">
        {isInitializing ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        ) : user ? (
          <>
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Увійти
            </Link>
            <Link href="/register" className={cn(buttonVariants())}>
              Реєстрація
            </Link>
          </>
        )}
      </div>
    </header>
  );
}