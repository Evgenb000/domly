"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/entities/session";
import { useSessionStore } from "@/shared/session/store";
import { Button } from "@/shared/ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoading(true);
    try {
      await logout();
    } catch {
    } finally {
      useSessionStore.getState().clear();
      router.push("/");
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={isLoading}>
      Вийти
    </Button>
  );
}