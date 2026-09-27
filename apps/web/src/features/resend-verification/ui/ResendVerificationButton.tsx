"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resendVerification } from "@/entities/session";
import { ApiError } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";

const COOLDOWN_MS = 30_000;

type Status = "idle" | "sending" | "sent";

export function ResendVerificationButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(async () => {
    if (status === "sending" || status === "sent") return;
    setFormError(null);
    setStatus("sending");
    try {
      await resendVerification();
      setStatus("sent");
      timerRef.current = window.setTimeout(() => setStatus("idle"), COOLDOWN_MS);
    } catch (error) {
      setStatus("idle");
      setFormError(
        error instanceof ApiError && error.fieldErrors
          ? "Перевірте правильність даних"
          : "Не вдалося надіслати лист",
      );
    }
  }, [status]);

  const disabled = status === "sending" || status === "sent";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
      >
        {status === "sending"
          ? "Надсилання..."
          : status === "sent"
            ? "Лист надіслано"
            : "Надіслати лист ще раз"}
      </Button>
      {formError ? (
        <p className="text-xs text-destructive">{formError}</p>
      ) : null}
    </div>
  );
}