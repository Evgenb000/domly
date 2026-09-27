import { Suspense } from "react";
import { LoginView } from "@/views/login";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Очікування...</p>}
    >
      <LoginView />
    </Suspense>
  );
}