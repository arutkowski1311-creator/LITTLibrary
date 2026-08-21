"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export type BagItem = {
  slug: string;
  name: string;
  price: number;
  speed: string;
  finish: string;
  personalization: string;
  image: string;
};

const STORAGE_KEY = "red-bucket-bag";

/**
 * The bag lives in localStorage and is read through `useSyncExternalStore`, so
 * the server renders an empty bag, hydration matches, and every component that
 * asks — the header count, the shop notice — sees the same value.
 */
const EMPTY: BagItem[] = [];
const listeners = new Set<() => void>();

// `getSnapshot` must return a stable reference for unchanged data or React will
// re-render forever, so the parsed bag is cached against the raw string.
let cachedRaw: string | null = null;
let cachedItems: BagItem[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing, blocked storage: behave as an empty bag.
    return null;
  }
}

function getSnapshot(): BagItem[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : EMPTY;
      cachedItems = Array.isArray(parsed) ? (parsed as BagItem[]) : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }
  return cachedItems;
}

function getServerSnapshot(): BagItem[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // A bag opened in a second tab stays in step with this one.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(next: BagItem[]) {
  cachedItems = next;
  cachedRaw = JSON.stringify(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // Storage is full or blocked; the bag still works for this page view.
  }
  for (const listener of listeners) listener();
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: BagItem) => write([...getSnapshot(), item]), []);
  const removeItem = useCallback(
    (index: number) => write(getSnapshot().filter((_, position) => position !== index)),
    [],
  );
  const clear = useCallback(() => write([]), []);

  return useMemo(
    () => ({ items, count: items.length, addItem, removeItem, clear }),
    [items, addItem, removeItem, clear],
  );
}
