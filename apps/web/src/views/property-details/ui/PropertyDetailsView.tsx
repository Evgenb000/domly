"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  formatPrice,
  getPriceLabel,
  getProperty,
  PROPERTY_STATUS_LABELS,
  PropertyDetailsInfo,
  PropertyGallery,
  type Property,
} from "@/entities/property";
import { AddToFavoritesButton } from "@/features/add-to-favorites";
import { CreateBookingButton } from "@/features/create-booking";
import { ApiError } from "@/shared/api/types";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { PROPERTY_DETAILS_VIEW_STRINGS } from "../model/strings";

interface LoadError {
  kind: "notFound" | "generic";
  message: string;
}

function toLoadError(error: unknown): LoadError {
  if (error instanceof ApiError && error.statusCode === 404) {
    return { kind: "notFound", message: error.message };
  }
  if (error instanceof Error && error.message) {
    return { kind: "generic", message: error.message };
  }
  return { kind: "generic", message: PROPERTY_DETAILS_VIEW_STRINGS.loadError };
}

interface PropertyDetailsViewProps {
  id: string;
}

export function PropertyDetailsView({ id }: PropertyDetailsViewProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const requestIdRef = useRef(0);

  async function loadProperty(
    fid: string,
    opts: { showLoading?: boolean; keepOnError?: boolean } = {},
  ) {
    if (opts.showLoading) setIsLoading(true);
    const requestId = ++requestIdRef.current;
    try {
      const result = await getProperty(fid);
      if (requestId !== requestIdRef.current) return;
      setError(null);
      setProperty(result);
      setIsLoading(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      if (!opts.keepOnError) setError(toLoadError(err));
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void getProperty(id)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setError(null);
        setProperty(result);
        setIsLoading(false);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError(toLoadError(err));
        setIsLoading(false);
      });
    return () => {
      requestIdRef.current += 1;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="aspect-16/9 w-full animate-pulse rounded-xl bg-secondary" />
          <div className="h-28 w-full animate-pulse rounded-xl bg-secondary" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-secondary" />
        </div>
        <div className="h-64 w-full animate-pulse rounded-xl bg-secondary lg:sticky lg:top-6" />
      </div>
    );
  }

  if (error) {
    if (error.kind === "notFound") {
      return (
        <div className="flex flex-col items-center gap-4 rounded-xl border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {PROPERTY_DETAILS_VIEW_STRINGS.notFoundTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {PROPERTY_DETAILS_VIEW_STRINGS.notFoundHint}
          </p>
          <Link
            href="/"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {PROPERTY_DETAILS_VIEW_STRINGS.notFoundBack}
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border-border bg-card p-5">
        <p className="text-sm text-destructive">{PROPERTY_DETAILS_VIEW_STRINGS.loadError}</p>
        <p className="max-w-full break-all text-xs text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={() => void loadProperty(id, { showLoading: true })}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          {PROPERTY_DETAILS_VIEW_STRINGS.retry}
        </button>
      </div>
    );
  }

  if (!property) return null;

  const price = getPriceLabel(property);
  const refetch = () => void loadProperty(id);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <PropertyGallery photos={property.photos} title={property.title} />
        <PropertyDetailsInfo property={property} />
      </div>

      <aside className="h-fit self-start lg:sticky lg:top-6">
        <Card className="w-full">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-primary">
                {formatPrice(price.amount)}
              </span>
              {price.suffix ? (
                <span className="text-sm text-muted-foreground">{price.suffix}</span>
              ) : null}
            </div>

            <div>
              <Badge variant={property.status === "RESERVED" ? "destructive" : "outline"}>
                {PROPERTY_STATUS_LABELS[property.status]}
              </Badge>
            </div>

            <AddToFavoritesButton propertyId={property.id} />
            <CreateBookingButton property={property} onBooked={refetch} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}