"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "cn";
import { addFavorite, getFavorites, removeFavorite } from "@/entities/favorite";
import { useSessionStore } from "@/shared/session/store";
import { buttonVariants } from "@/shared/ui/button";
import { ADD_TO_FAVORITES_STRINGS } from "../model/strings";

interface AddToFavoritesButtonProps {
  propertyId: string;
}

export function AddToFavoritesButton({ propertyId }: AddToFavoritesButtonProps) {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInitializing || !user) return;
    let cancelled = false;
    void getFavorites()
      .then((favorites) => {
        if (cancelled) return;
        setIsFavorite(favorites.some((f) => f.propertyId === propertyId));
      })
      .catch(() => {
        if (cancelled) return;
        setIsFavorite(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInitializing, user, propertyId]);

  if (isInitializing) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />;
  }

  if (!user) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(`/properties/${propertyId}`)}`}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        aria-label={ADD_TO_FAVORITES_STRINGS.addLabel}
      >
        <Heart className="size-5" />
        {ADD_TO_FAVORITES_STRINGS.addLabel}
      </Link>
    );
  }

  if (isFavorite === null) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted" />;
  }

  const toggle = async () => {
    if (isToggling || isFavorite === null) return;
    const previous = isFavorite;
    setIsFavorite(!previous);
    setIsToggling(true);
    setError(null);
    try {
      if (previous) {
        await removeFavorite(propertyId);
      } else {
        await addFavorite(propertyId);
      }
    } catch {
      setIsFavorite(previous);
      setError(ADD_TO_FAVORITES_STRINGS.toggleError);
    } finally {
      setIsToggling(false);
    }
  };

  const label = isFavorite
    ? ADD_TO_FAVORITES_STRINGS.removeLabel
    : ADD_TO_FAVORITES_STRINGS.addLabel;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isToggling}
        aria-pressed={isFavorite}
        aria-label={label}
        title={label}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
      >
        <Heart className={`size-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
        {label}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}