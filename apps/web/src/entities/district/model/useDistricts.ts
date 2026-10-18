"use client";

import { useEffect, useState } from "react";
import { getDistricts } from "../api/getDistricts";
import type { District } from "./types";

export function useDistricts() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getDistricts()
      .then((result) => {
        if (!cancelled) {
          setIsError(false);
          setDistricts(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setDistricts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { districts, isLoading, isError };
}