"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Favorite } from "@/entities/favorite";
import { getFavorites } from "@/entities/favorite";
import { PropertyCard, PropertyCardSkeleton } from "@/entities/property";
import { RemoveFromFavoritesButton } from "@/features/remove-from-favorites";
import { FAVORITES_VIEW_STRINGS } from "../model/strings";

export function FavoritesView() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void getFavorites()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setError(false);
        setFavorites(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
        setIsLoading(false);
      });
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const retry = () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(false);
    void getFavorites()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setFavorites(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
        setIsLoading(false);
      });
  };

  const handleRemoved = (propertyId: string) => {
    setFavorites((prev) => prev.filter((f) => f.propertyId !== propertyId));
  };

  if (isLoading) {
    return (
      <section className="flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {FAVORITES_VIEW_STRINGS.title}
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {FAVORITES_VIEW_STRINGS.title}
        </h1>
        <div className="flex flex-col items-start gap-3 rounded-xl border-border bg-card p-5">
          <p className="text-sm text-destructive">
            {FAVORITES_VIEW_STRINGS.loadError}
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {FAVORITES_VIEW_STRINGS.retry}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">
        {FAVORITES_VIEW_STRINGS.title}
      </h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            {FAVORITES_VIEW_STRINGS.empty}
          </p>
          <Link
            href="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {FAVORITES_VIEW_STRINGS.browse}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="flex flex-col gap-3">
              <PropertyCard property={favorite.property} />
              <RemoveFromFavoritesButton
                propertyId={favorite.propertyId}
                onRemoved={handleRemoved}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
