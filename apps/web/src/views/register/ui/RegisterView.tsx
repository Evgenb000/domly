import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { RegisterForm } from "@/features/auth-register";
import { GoogleLoginButton } from "@/features/auth-google";

export function RegisterView() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Реєстрація</CardTitle>
          <CardDescription>
            Створіть акаунт, щоб розміщувати об’єкти та бронювати житло
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RegisterForm />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            або
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleLoginButton />
          <p className="text-center text-sm text-muted-foreground">
            Вже маєте акаунт?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Увійти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}