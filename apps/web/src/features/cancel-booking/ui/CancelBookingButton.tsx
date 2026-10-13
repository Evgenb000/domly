"use client";

import { useState } from "react";
import { cn } from "cn";
import { cancelBooking } from "@/entities/booking";
import { buttonVariants } from "@/shared/ui/button";
import { ApiError } from "@/shared/api/types";
import { CANCEL_BOOKING_STRINGS } from "../model/strings";

type CancelState = "idle" | "confirm" | "pending";

interface CancelBookingButtonProps {
  bookingId: string;
  onCancelled: (bookingId: string) => void;
  onInactive: () => void;
}

export function CancelBookingButton({
  bookingId,
  onCancelled,
  onInactive,
}: CancelBookingButtonProps) {
  const [state, setState] = useState<CancelState>("idle");
  const [error, setError] = useState<string | null>(null);
  const isPending = state === "pending";

  const submit = async () => {
    if (isPending) return;
    setState("pending");
    setError(null);
    try {
      await cancelBooking(bookingId);
      onCancelled(bookingId);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(CANCEL_BOOKING_STRINGS.alreadyInactive);
        onInactive();
      } else {
        setError(CANCEL_BOOKING_STRINGS.genericError);
      }
      setState("idle");
    }
  };

  if (state === "idle") {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setState("confirm");
          }}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          {CANCEL_BOOKING_STRINGS.cancel}
        </button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
      >
        {isPending ? CANCEL_BOOKING_STRINGS.canceling : CANCEL_BOOKING_STRINGS.confirmYes}
      </button>
      <button
        type="button"
        onClick={() => {
          setState("idle");
          setError(null);
        }}
        disabled={isPending}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {CANCEL_BOOKING_STRINGS.confirmNo}
      </button>
    </div>
  );
}

