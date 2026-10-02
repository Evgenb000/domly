"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import type { Property } from "@/entities/property";
import { createBooking } from "@/entities/booking";
import { useSessionStore } from "@/shared/session/store";
import { buttonVariants } from "@/shared/ui/button";
import { ApiError } from "@/shared/api/types";
import { CREATE_BOOKING_STRINGS } from "../model/strings";

interface CreateBookingButtonProps {
  property: Property;
  onBooked: () => void;
}

export function CreateBookingButton({ property, onBooked }: CreateBookingButtonProps) {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);
  const [state, setState] = useState<"idle" | "pending" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  if (isInitializing) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />;
  }

  if (!user) {
    if (property.status !== "AVAILABLE") return null;
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(`/properties/${property.id}`)}`}
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        {CREATE_BOOKING_STRINGS.book}
      </Link>
    );
  }

  if (user.id === property.ownerId) return null;

  if (state === "success") {
    return <p className="text-sm text-primary">{CREATE_BOOKING_STRINGS.success}</p>;
  }

  if (property.status !== "AVAILABLE") {
    return error ? (
      <p className="text-sm text-destructive">{error}</p>
    ) : null;
  }

  const submit = async () => {
    if (state === "pending") return;
    setState("pending");
    setError(null);
    try {
      await createBooking(property.id);
      setState("success");
      onBooked();
    } catch (err) {
      setState("idle");
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(CREATE_BOOKING_STRINGS.alreadyReserved);
        onBooked();
      } else {
        setError(CREATE_BOOKING_STRINGS.genericError);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={submit}
        disabled={state === "pending"}
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        {state === "pending" ? CREATE_BOOKING_STRINGS.booking : CREATE_BOOKING_STRINGS.book}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}