"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "cn";
import { removeFavorite } from "@/entities/favorite";
import { buttonVariants } from "@/shared/ui/button";
import { REMOVE_FROM_FAVORITES_STRINGS } from "../model/strings";

interface RemoveFromFavoritesButtonProps {
  propertyId: string;
  onRemoved: (propertyId: string) => void;
}

export function RemoveFromFavoritesButton({
  propertyId,
  onRemoved,
}: RemoveFromFavoritesButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(false);

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    setError(false);
    try {
      await removeFavorite(propertyId);
      onRemoved(propertyId);
    } catch {
      setError(true);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving}
        aria-label={REMOVE_FROM_FAVORITES_STRINGS.label}
        title={REMOVE_FROM_FAVORITES_STRINGS.label}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
      >
        <Heart className="size-5 fill-primary text-primary" />
        {REMOVE_FROM_FAVORITES_STRINGS.label}
      </button>
      {error ? (
        <p className="text-xs text-destructive">
          {REMOVE_FROM_FAVORITES_STRINGS.error}
        </p>
      ) : null}
    </div>
  );
}
