"use client";

import { useSessionStore } from "@/shared/session/store";

export function ProfileView() {
  const user = useSessionStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-semibold">Профіль</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-muted-foreground">Ім&apos;я</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <dt className="text-muted-foreground">Роль</dt>
          <dd>{user.role}</dd>
        </div>
        <div className="flex justify-between pb-2">
          <dt className="text-muted-foreground">Пошта підтверджена</dt>
          <dd>{user.emailVerified ? "Так" : "Ні"}</dd>
        </div>
      </dl>
    </div>
  );
}
