import { Suspense } from "react";
import { AuthCallbackView } from "@/views/auth-callback";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Очікування...</p>}
    >
      <AuthCallbackView />
    </Suspense>
  );
}