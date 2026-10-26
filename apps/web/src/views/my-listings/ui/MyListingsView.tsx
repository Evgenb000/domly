"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MODERATION_STATUS_LABELS,
  PROPERTY_STATUS_LABELS,
  PropertyCard,
  PropertyCardSkeleton,
  getMyProperties,
  type PaginationMeta,
  type Property,
} from "@/entities/property";
import { Badge } from "@/shared/ui/badge";
import { DeletePropertyButton } from "@/features/delete-property";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "cn";
import { MY_LISTINGS_VIEW_STRINGS } from "../model/strings";

export function MyListingsView() {
  const [items, setItems] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void getMyProperties(1)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setItems(result.items);
        setMeta(result.meta);
        setError(false);
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
    setLoadMoreError(false);
    setIsLoadingMore(false);
    void getMyProperties(1)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setItems(result.items);
        setMeta(result.meta);
        setError(false);
        setIsLoading(false);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
        setIsLoading(false);
      });
  };

  const reloadFirstPage = () => {
    const requestId = ++requestIdRef.current;
    setLoadMoreError(false);
    setIsLoadingMore(false);
    void getMyProperties(1)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setItems(result.items);
        setMeta(result.meta);
      })
      .catch(() => undefined);
  };

  const loadMore = () => {
    if (isLoadingMore) return;
    if (meta === null || meta.page >= meta.totalPages) return;

    const requestId = ++requestIdRef.current;
    const nextPage = meta.page + 1;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    void getMyProperties(nextPage)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setItems((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return [
            ...prev,
            ...result.items.filter((item) => !seen.has(item.id)),
          ];
        });
        setMeta(result.meta);
        setIsLoadingMore(false);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setLoadMoreError(true);
        setIsLoadingMore(false);
      });
  };

  const handleDeleted = (propertyId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== propertyId));
    reloadFirstPage();
  };

  if (isLoading) {
    return (
      <section className="flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {MY_LISTINGS_VIEW_STRINGS.title}
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
          {MY_LISTINGS_VIEW_STRINGS.title}
        </h1>
        <div className="flex flex-col items-start gap-3 rounded-xl border-border bg-card p-5">
          <p className="text-sm text-destructive">
            {MY_LISTINGS_VIEW_STRINGS.loadError}
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {MY_LISTINGS_VIEW_STRINGS.retry}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">
        {MY_LISTINGS_VIEW_STRINGS.title}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            {MY_LISTINGS_VIEW_STRINGS.empty}
          </p>
          <Link
            href="/properties/new"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {MY_LISTINGS_VIEW_STRINGS.addListing}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                actions={
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          property.moderationStatus === "REJECTED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {MODERATION_STATUS_LABELS[property.moderationStatus]}
                      </Badge>
                      {property.status === "RESERVED" ? (
                        <Badge variant="outline">
                          {PROPERTY_STATUS_LABELS[property.status]}
                        </Badge>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {MY_LISTINGS_VIEW_STRINGS.viewsFormat(
                          property.viewsCount,
                        )}
                      </span>
                    </div>
                    {property.moderationStatus === "REJECTED" ? (
                      <p className="text-xs text-destructive">
                        {MY_LISTINGS_VIEW_STRINGS.rejectedNote}
                      </p>
                    ) : null}
                    <Link
                      href={`/properties/${property.id}/edit`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      {MY_LISTINGS_VIEW_STRINGS.edit}
                    </Link>
                    <DeletePropertyButton
                      propertyId={property.id}
                      onDeleted={handleDeleted}
                    />
                  </>
                }
              />
            ))}
          </div>

          {meta !== null && meta.page < meta.totalPages ? (
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {isLoadingMore
                  ? MY_LISTINGS_VIEW_STRINGS.loadMoreLoading
                  : MY_LISTINGS_VIEW_STRINGS.loadMore}
              </button>
              {loadMoreError ? (
                <p className="text-sm text-destructive">
                  {MY_LISTINGS_VIEW_STRINGS.loadMoreError}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
