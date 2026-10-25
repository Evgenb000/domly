"use client";

import { useState } from "react";
import { cn } from "cn";
import { deleteProperty } from "@/entities/property";
import { buttonVariants } from "@/shared/ui/button";
import { ApiError } from "@/shared/api/types";
import { DELETE_PROPERTY_STRINGS } from "../model/strings";

type DeleteState = "idle" | "confirm" | "pending";

interface DeletePropertyButtonProps {
  propertyId: string;
  onDeleted: (propertyId: string) => void;
}

export function DeletePropertyButton({
  propertyId,
  onDeleted,
}: DeletePropertyButtonProps) {
  const [state, setState] = useState<DeleteState>("idle");
  const [error, setError] = useState<string | null>(null);
  const isPending = state === "pending";

  const submit = async () => {
    if (isPending) return;
    setState("pending");
    setError(null);
    try {
      await deleteProperty(propertyId);
      onDeleted(propertyId);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        onDeleted(propertyId);
        return;
      }
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(DELETE_PROPERTY_STRINGS.reservedError);
      } else {
        setError(DELETE_PROPERTY_STRINGS.genericError);
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
          {DELETE_PROPERTY_STRINGS.delete}
        </button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {DELETE_PROPERTY_STRINGS.confirmText}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
        >
          {isPending
            ? DELETE_PROPERTY_STRINGS.deleting
            : DELETE_PROPERTY_STRINGS.confirmYes}
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
          {DELETE_PROPERTY_STRINGS.confirmNo}
        </button>
      </div>
    </div>
  );
}
