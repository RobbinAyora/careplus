"use client";

import { useCallback, useRef } from "react";

function createKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useIdempotencyKey() {
  const stored = useRef<{ fingerprint: string; key: string } | null>(null);

  const keyFor = useCallback((body: unknown): string => {
    const fingerprint = JSON.stringify(body ?? null);

    if (!stored.current || stored.current.fingerprint !== fingerprint) {
      stored.current = { fingerprint, key: createKey() };
    }

    return stored.current.key;
  }, []);

  const reset = useCallback(() => {
    stored.current = null;
  }, []);

  return { keyFor, reset };
}