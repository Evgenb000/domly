"use client";

import { useEffect } from "react";
import { ensureSession } from "./bootstrap";

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    void ensureSession();
  }, []);

  return <>{children}</>;
}