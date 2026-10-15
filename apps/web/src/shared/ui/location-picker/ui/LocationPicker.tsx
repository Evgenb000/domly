"use client";

import { cn } from "cn";
import dynamic from "next/dynamic";
import { LOCATION_PICKER_STRINGS } from "../model/strings";
import type { Coordinates } from "../model/types";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((module) => module.LocationPickerMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
  },
);

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  className,
}: LocationPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "relative h-80 w-full overflow-hidden rounded-xl border border-border",
          className,
        )}
      >
        <LocationPickerMap value={value} onChange={onChange} />
      </div>
      <p className="text-xs text-muted-foreground">
        {LOCATION_PICKER_STRINGS.hint}
      </p>
      <p className="text-xs text-muted-foreground">
        {value === null
          ? LOCATION_PICKER_STRINGS.empty
          : `${LOCATION_PICKER_STRINGS.coordinates}: ${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`}
      </p>
    </div>
  );
}