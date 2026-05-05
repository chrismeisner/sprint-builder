"use client";

import { useEffect, useState } from "react";

/**
 * Drop-in useState that persists to localStorage. Used in the prototype so
 * edits on a pushed detail screen survive when the user navigates back to
 * the parent summary — without standing up a real state layer.
 *
 * On mount, hydrates from localStorage if present. On every change, writes
 * back. Cross-route reads work because each route's component re-mounts
 * and rehydrates from storage. Cross-tab live updates are not wired
 * (out of scope for the prototype).
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, [key]);

  function update(next: T) {
    setValue(next);
    if (hydrated) {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota / privacy-mode failures
      }
    }
  }

  return [value, update];
}
