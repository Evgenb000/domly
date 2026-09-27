import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { LoginForm } from "@/features/auth-login";
import { GoogleLoginButton } from "@/features/auth-google";

export function LoginView() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вхід</CardTitle>
          <CardDescription>
            Увійдіть, щоб керувати об’єктами та бронюваннями
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            або
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleLoginButton />
          <p className="text-center text-sm text-muted-foreground">
            Немає акаунта?{" "}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Зареєструватися
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}