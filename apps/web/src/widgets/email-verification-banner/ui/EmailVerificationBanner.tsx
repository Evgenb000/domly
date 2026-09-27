"use client";

import { useSessionStore } from "@/shared/session/store";
import { ResendVerificationButton } from "@/features/resend-verification";

export function EmailVerificationBanner() {
  const user = useSessionStore((s) => s.user);

  if (!user || user.emailVerified) return null;

  return (
    <div
      role="status"
      className="border-b border-border bg-amber-500/10 px-4 py-3"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          <span className="font-medium">Підтвердіть email</span>
          <span className="text-muted-foreground"> ({user.email})</span>
          {" — щоб активувати всі можливості акаунта."}
        </p>
        <ResendVerificationButton />
      </div>
    </div>
  );
}