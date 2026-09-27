"use client";

import { useEffect, useState } from "react";
import { getDistricts } from "../api/getDistricts";
import type { District } from "./types";

export function useDistricts() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getDistricts()
      .then((result) => {
        if (!cancelled) setDistricts(result);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { districts, isLoading };
}