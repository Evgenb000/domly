"use client";

import { getApiBaseUrl } from "@/shared/api/url";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "cn";

export function GoogleLoginButton() {
  return (
    <a
      href={`${getApiBaseUrl()}/auth/google`}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
    >
      Увійти через Google
    </a>
  );
}