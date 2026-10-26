"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PROPERTY_FORM_STRINGS } from "../model/strings";

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
      setError(PROPERTY_FORM_STRINGS.photoInvalid);
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError(PROPERTY_FORM_STRINGS.photoInvalid);
      return;
    }

    if (value.includes(trimmed)) {
      setError(PROPERTY_FORM_STRINGS.photoDuplicate);
      return;
    }

    if (value.length >= MAX_PHOTOS) {
      setError(PROPERTY_FORM_STRINGS.photosLimit);
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
        {PROPERTY_FORM_STRINGS.photosHint}
      </p>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={PROPERTY_FORM_STRINGS.photoUrlPlaceholder}
          aria-invalid={Boolean(error)}
        />
        <Button type="button" onClick={handleAdd}>
          {PROPERTY_FORM_STRINGS.addPhoto}
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
                {PROPERTY_FORM_STRINGS.removePhoto}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}