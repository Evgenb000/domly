"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CREATE_PROPERTY_STRINGS } from "../model/strings";

const MAX_PHOTOS = 20;

interface PhotosFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function PhotosField({ value, onChange }: PhotosFieldProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (trimmed === "") return;

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setError(CREATE_PROPERTY_STRINGS.photoInvalid);
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError(CREATE_PROPERTY_STRINGS.photoInvalid);
      return;
    }

    if (value.includes(trimmed)) {
      setError(CREATE_PROPERTY_STRINGS.photoDuplicate);
      return;
    }

    if (value.length >= MAX_PHOTOS) {
      setError(CREATE_PROPERTY_STRINGS.photosLimit);
      return;
    }

    onChange([...value, trimmed]);
    setDraft("");
    setError(null);
  };

  const handleRemove = (url: string) => {
    onChange(value.filter((item) => item !== url));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {CREATE_PROPERTY_STRINGS.photosHint}
      </p>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={CREATE_PROPERTY_STRINGS.photoUrlPlaceholder}
          aria-invalid={Boolean(error)}
        />
        <Button type="button" onClick={handleAdd}>
          {CREATE_PROPERTY_STRINGS.addPhoto}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((url) => (
            <li
              key={url}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="truncate text-sm text-muted-foreground">{url}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(url)}
              >
                {CREATE_PROPERTY_STRINGS.removePhoto}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}