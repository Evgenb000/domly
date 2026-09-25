"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyQueryDto } from "@domly/shared";

import { getProperties } from "@/entities/property/api/getProperties";
import type { PaginationMeta, Property } from "@/entities/property/model/types";
import { PropertyCard } from "@/entities/property/ui/PropertyCard";
import { useIntersectionObserver } from "@/shared/hooks/useIntersectionObserver";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const FEED_PAGE_LIMIT = 12;

type SortBy = PropertyQueryDto["sortBy"];
type SortOrder = PropertyQueryDto["sortOrder"];
type SortKey = `${SortBy}_${SortOrder}`;

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "createdAt_desc", label: "Спочатку нові" },
  { value: "price_asc", label: "Ціна: від дешевших" },
  { value: "price_desc", label: "Ціна: від дорогих" },
];

const DEFAULT_SORT: { sortBy: SortBy; sortOrder: SortOrder } = {
  sortBy: "createdAt",
  sortOrder: "desc",
};

function parseSortKey(key: SortKey): { sortBy: SortBy; sortOrder: SortOrder } {
  const [sortBy, sortOrder] = key.split("_");
  return { sortBy, sortOrder } as { sortBy: SortBy; sortOrder: SortOrder };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Невідома помилка";
}

function PropertyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border-border bg-card p-4">
      <div className="mb-3 aspect-4/3 w-full rounded-lg bg-secondary" />
      <div className="mb-1 h-4 w-2/3 rounded bg-muted" />
      <div className="mb-3 h-3 w-1/2 rounded bg-muted" />
      <div className="h-4 w-1/3 rounded bg-muted" />
    </div>
  );
}

export function PropertyFeed() {
  const [items, setItems] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT.sortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT.sortOrder);

  const requestIdRef = useRef(0);

  const fetchFirstPage = async (
    nextSortBy: SortBy,
    nextSortOrder: SortOrder,
  ) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const result = await getProperties({
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
        page: 1,
        limit: FEED_PAGE_LIMIT,
      });
      if (requestId !== requestIdRef.current) return;
      setError(null);
      setItems(result.items);
      setMeta(result.meta);
      setPage(result.meta.page);
      setIsLoading(false);
    } catch (fetchError) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(fetchError));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void getProperties({
      sortBy: DEFAULT_SORT.sortBy,
      sortOrder: DEFAULT_SORT.sortOrder,
      page: 1,
      limit: FEED_PAGE_LIMIT,
    })
      .then((firstPage) => {
        if (requestId !== requestIdRef.current) return;
        setError(null);
        setItems(firstPage.items);
        setMeta(firstPage.meta);
        setPage(firstPage.meta.page);
      })
      .catch((fetchError: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setError(getErrorMessage(fetchError));
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const loadMore = async () => {
    if (isLoading) return;
    if (meta === null || page >= meta.totalPages) return;

    const requestId = ++requestIdRef.current;
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const result = await getProperties({
        sortBy,
        sortOrder,
        page: nextPage,
        limit: FEED_PAGE_LIMIT,
      });
      if (requestId !== requestIdRef.current) return;
      setItems((prev) => [...prev, ...result.items]);
      setMeta(result.meta);
      setPage(nextPage);
      setError(null);
      setIsLoading(false);
    } catch (fetchError) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(fetchError));
      setIsLoading(false);
    }
  };

  const retry = () => {
    setError(null);
    setIsLoading(true);
    void fetchFirstPage(sortBy, sortOrder);
  };

  const handleSortChange = (key: SortKey) => {
    const next = parseSortKey(key);
    setSortBy(next.sortBy);
    setSortOrder(next.sortOrder);
    setError(null);
    setIsLoading(true);
    void fetchFirstPage(next.sortBy, next.sortOrder);
  };

  const sentinelRef = useIntersectionObserver(loadMore);
  const hasMore = meta !== null && page < meta.totalPages;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Оголошення</h1>
        <Select
          value={`${sortBy}_${sortOrder}`}
          onValueChange={(value) => {
            if (value) handleSortChange(value as SortKey);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Сортування" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: FEED_PAGE_LIMIT }, (_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border-border bg-card p-5">
          <p className="text-sm text-destructive">
            Не вдалося завантажити оголошення.
          </p>
          <p className="max-w-full break-all text-xs text-muted-foreground">
            {error}
          </p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Спробувати ще раз
          </button>
        </div>
      ) : null}

      {hasMore ? <div ref={sentinelRef} className="h-4 w-full" /> : null}
    </section>
  );
}