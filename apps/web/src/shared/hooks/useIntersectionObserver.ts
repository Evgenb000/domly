import { useCallback, useEffect, useRef } from "react";

export function useIntersectionObserver(
  onIntersect: () => void,
  options?: IntersectionObserverInit,
): (node: HTMLDivElement | null) => void {
  const onIntersectRef = useRef(onIntersect);
  const optionsRef = useRef<IntersectionObserverInit | undefined>(options);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
    optionsRef.current = options;
  });

  return useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onIntersectRef.current();
        }
      }, optionsRef.current);
      observer.observe(node);
      observerRef.current = observer;
    },
    [],
  );
}