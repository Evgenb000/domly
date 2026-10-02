"use client";

import { useState } from "react";
import Image from "next/image";
import { PROPERTY_GALLERY_STRINGS } from "../model/strings";
import { cn } from "cn";

interface PropertyGalleryProps {
  photos: string[];
  title: string;
}

export function PropertyGallery({ photos, title }: PropertyGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-16/9 w-full items-center justify-center rounded-xl bg-secondary text-sm text-muted-foreground">
        {PROPERTY_GALLERY_STRINGS.empty}
      </div>
    );
  }

  const activeIndex = selected < photos.length ? selected : 0;
  const activePhoto = photos[activeIndex];
  const showThumbnails = photos.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-secondary">
        {activePhoto ? (
          <Image
            src={activePhoto}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
          />
        ) : null}
      </div>

      {showThumbnails ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={PROPERTY_GALLERY_STRINGS.thumbnailLabel(index + 1)}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary transition-opacity",
                index === activeIndex
                  ? "ring-2 ring-primary"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              {photo ? (
                <Image
                  src={photo}
                  alt=""
                  aria-hidden
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}