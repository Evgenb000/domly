import { Suspense } from "react";
import { VerifyEmailView } from "@/views/verify-email";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Завантаження...</p>}
    >
      <VerifyEmailView />
    </Suspense>
  );
}