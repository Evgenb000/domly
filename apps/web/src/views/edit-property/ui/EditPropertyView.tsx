"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getProperty, toFormValues, type Property } from "@/entities/property";
import { PropertyForm } from "@/features/property-form";
import { ApiError } from "@/shared/api/types";
import { useSessionStore } from "@/shared/session/store";
import { EDIT_PROPERTY_VIEW_STRINGS } from "../model/strings";

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
  return { kind: "generic", message: EDIT_PROPERTY_VIEW_STRINGS.loadError };
}

interface EditPropertyViewProps {
  id: string;
}

function notFoundScreen() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-border bg-card p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        {EDIT_PROPERTY_VIEW_STRINGS.notFoundTitle}
      </h1>
      <p className="text-sm text-muted-foreground">
        {EDIT_PROPERTY_VIEW_STRINGS.notFoundHint}
      </p>
      <Link
        href="/my-listings"
        className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
      >
        {EDIT_PROPERTY_VIEW_STRINGS.back}
      </Link>
    </div>
  );
}

export function EditPropertyView({ id }: EditPropertyViewProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const requestIdRef = useRef(0);
  const user = useSessionStore((s) => s.user);

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
      <div className="max-w-2xl flex flex-col gap-6">
        <div className="h-8 w-full animate-pulse rounded-xl bg-secondary" />
        <div className="h-32 w-full animate-pulse rounded-xl bg-secondary" />
        <div className="h-8 w-3/4 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  if (error) {
    if (error.kind === "notFound") {
      return notFoundScreen();
    }

    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border-border bg-card p-5">
        <p className="text-sm text-destructive">
          {EDIT_PROPERTY_VIEW_STRINGS.loadError}
        </p>
        <p className="max-w-full break-all text-xs text-muted-foreground">
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => void loadProperty(id, { showLoading: true })}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          {EDIT_PROPERTY_VIEW_STRINGS.retry}
        </button>
      </div>
    );
  }

  if (!property) return null;

  if (
    user === null ||
    (user.id !== property.ownerId && user.role !== "ADMIN")
  ) {
    return notFoundScreen();
  }

  const initialValues = toFormValues(property);
  if (initialValues === null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border-border bg-card p-8 text-center">
        <p className="text-sm text-destructive">
          {EDIT_PROPERTY_VIEW_STRINGS.invalidData}
        </p>
        <Link
          href="/my-listings"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          {EDIT_PROPERTY_VIEW_STRINGS.back}
        </Link>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">
        {EDIT_PROPERTY_VIEW_STRINGS.title}
      </h1>
      <PropertyForm
        key={property.id}
        edit={{ propertyId: property.id, initialValues }}
      />
    </section>
  );
}
