"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUserDto } from "@domly/shared";
import { useSessionStore } from "./store";
import { LoadingScreen } from "@/shared/ui/loading-screen";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: AuthUserDto["role"][];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  const isAuthorized =
    !!user && (!requiredRoles || requiredRoles.includes(user.role));

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [isInitializing, user, requiredRoles, router, pathname]);

  if (isInitializing || !isAuthorized) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
